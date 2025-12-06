import { Socket } from "socket.io";
import { MessageService } from "./message.service";
import { MessageType } from "./message.interface";
import { ChatService } from "../chat/chat.service";

interface ISocketUser {
  userId: string;
  socketId: string;
}

interface ISendMessagePayload {
  chatId: string;
  receiverId: string;
  content?: string;
  mediaUrl?: string;
  messageType: MessageType;
}

interface ITypingPayload {
  chatId: string;
  receiverId: string;
}

interface IMarkReadPayload {
  chatId: string;
}

interface IBlockUserPayload {
  chatId: string;
}

export const messageSocketHandlers = (
  socket: Socket,
  io: any,
  onlineUsers: Map<string, ISocketUser>
) => {
  // Send message via socket
  socket.on(
    "send_message",
    async (payload: ISendMessagePayload, callback?: Function) => {
      try {
        const userId = socket.data.userId;

        console.log(payload);

        if (!userId) {
          const error = { message: "Unauthorized: User not authenticated" };
          if (callback) callback({ error });
          socket.emit("error", error);
          return;
        }

        // Validate payload
        if (!payload.chatId || !payload.receiverId) {
          const error = { message: "Chat ID and Receiver ID are required" };
          if (callback) callback({ error });
          socket.emit("error", error);
          return;
        }

        if (!payload.content && !payload.mediaUrl) {
          const error = {
            message: "Either content or mediaUrl must be provided",
          };
          if (callback) callback({ error });
          socket.emit("error", error);
          return;
        }

        // Create message
        const message = await MessageService.createMessage({
          chatId: payload.chatId,
          senderId: userId,
          receiverId: payload.receiverId,
          content: payload.content,
          mediaUrl: payload.mediaUrl,
          messageType: payload.messageType || MessageType.TEXT,
        });

        // Send to sender
        socket.emit("message_sent", {
          success: true,
          message,
        });

        // Send acknowledgment if callback provided
        if (callback) {
          callback({ success: true, message });
        }

        // Find receiver's socket and send message
        const receiverSocketId = Array.from(onlineUsers.values()).find(
          (user) => user.userId === payload.receiverId
        )?.socketId;

        if (receiverSocketId) {

          io.to(receiverSocketId).emit("new_message", {
            message,
          });
        }

        // Emit to both users to update chat list
        socket.emit("chat_updated", { chatId: payload.chatId });
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("chat_updated", {
            chatId: payload.chatId,
          });
        }
      } catch (error: any) {
        console.error("Error sending message:", error);
        const errorResponse = {
          message: error.message || "Failed to send message",
        };

        if (callback) {
          callback({ error: errorResponse });
        }

        socket.emit("error", errorResponse);
      }
    }
  );

  // Mark messages as read
  socket.on(
    "mark_messages_read",
    async (payload: IMarkReadPayload, callback?: Function) => {
      try {
        const userId = socket.data.userId;

        if (!userId) {
          const error = { message: "Unauthorized: User not authenticated" };
          if (callback) callback({ error });
          socket.emit("error", error);
          return;
        }

        if (!payload.chatId) {
          const error = { message: "Chat ID is required" };
          if (callback) callback({ error });
          socket.emit("error", error);
          return;
        }

        await MessageService.markMessagesAsRead(payload.chatId, userId);

        // Emit to sender
        socket.emit("messages_marked_read", {
          success: true,
          chatId: payload.chatId,
        });

        if (callback) {
          callback({ success: true });
        }

        // Get chat to find other user
        const chat = await ChatService.getChatById(payload.chatId);
        const otherUserId = chat.users
          .find((id) => id.toString() !== userId)
          ?.toString();

        // Notify the other user that messages were read
        if (otherUserId) {
          const otherUserSocketId = Array.from(onlineUsers.values()).find(
            (user) => user.userId === otherUserId
          )?.socketId;

          if (otherUserSocketId) {
            io.to(otherUserSocketId).emit("messages_read_by_other", {
              chatId: payload.chatId,
              readByUserId: userId,
            });
          }
        }
      } catch (error: any) {
        console.error("Error marking messages as read:", error);
        const errorResponse = {
          message: error.message || "Failed to mark messages as read",
        };

        if (callback) {
          callback({ error: errorResponse });
        }

        socket.emit("error", errorResponse);
      }
    }
  );

  // Typing indicator
  socket.on("typing_start", (payload: ITypingPayload) => {
    try {
      const userId = socket.data.userId;

      if (!userId || !payload.chatId || !payload.receiverId) {
        return;
      }

      // Find receiver's socket
      const receiverSocketId = Array.from(onlineUsers.values()).find(
        (user) => user.userId === payload.receiverId
      )?.socketId;

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("user_typing", {
          chatId: payload.chatId,
          userId,
        });
      }
    } catch (error: any) {
      console.error("Error handling typing start:", error);
    }
  });

  socket.on("typing_stop", (payload: ITypingPayload) => {
    try {
      const userId = socket.data.userId;

      if (!userId || !payload.chatId || !payload.receiverId) {
        return;
      }

      // Find receiver's socket
      const receiverSocketId = Array.from(onlineUsers.values()).find(
        (user) => user.userId === payload.receiverId
      )?.socketId;

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("user_stopped_typing", {
          chatId: payload.chatId,
          userId,
        });
      }
    } catch (error: any) {
      console.error("Error handling typing stop:", error);
    }
  });

  // Block user
  socket.on(
    "block_user",
    async (payload: IBlockUserPayload, callback?: Function) => {
      try {
        const userId = socket.data.userId;

        if (!userId) {
          const error = { message: "Unauthorized: User not authenticated" };
          if (callback) callback({ error });
          socket.emit("error", error);
          return;
        }

        if (!payload.chatId) {
          const error = { message: "Chat ID is required" };
          if (callback) callback({ error });
          socket.emit("error", error);
          return;
        }

        const chat = await ChatService.blockUser(payload.chatId, userId);

        // Emit to blocker
        socket.emit("user_blocked", {
          success: true,
          chat,
        });

        if (callback) {
          callback({ success: true, chat });
        }

        // Notify the blocked user
        const blockedUserId = chat.users
          .find((id) => id.toString() !== userId)
          ?.toString();

        if (blockedUserId) {
          const blockedUserSocketId = Array.from(onlineUsers.values()).find(
            (user) => user.userId === blockedUserId
          )?.socketId;

          if (blockedUserSocketId) {
            io.to(blockedUserSocketId).emit("you_were_blocked", {
              chatId: payload.chatId,
              blockedByUserId: userId,
            });
          }
        }
      } catch (error: any) {
        console.error("Error blocking user:", error);
        const errorResponse = {
          message: error.message || "Failed to block user",
        };

        if (callback) {
          callback({ error: errorResponse });
        }

        socket.emit("error", errorResponse);
      }
    }
  );

  // Unblock user
  socket.on(
    "unblock_user",
    async (payload: IBlockUserPayload, callback?: Function) => {
      try {
        const userId = socket.data.userId;

        if (!userId) {
          const error = { message: "Unauthorized: User not authenticated" };
          if (callback) callback({ error });
          socket.emit("error", error);
          return;
        }

        if (!payload.chatId) {
          const error = { message: "Chat ID is required" };
          if (callback) callback({ error });
          socket.emit("error", error);
          return;
        }

        const chat = await ChatService.unblockUser(payload.chatId, userId);

        // Emit to unblocker
        socket.emit("user_unblocked", {
          success: true,
          chat,
        });

        if (callback) {
          callback({ success: true, chat });
        }

        // Notify the unblocked user
        const unblockedUserId = chat.users
          .find((id) => id.toString() !== userId)
          ?.toString();

        if (unblockedUserId) {
          const unblockedUserSocketId = Array.from(onlineUsers.values()).find(
            (user) => user.userId === unblockedUserId
          )?.socketId;

          if (unblockedUserSocketId) {
            io.to(unblockedUserSocketId).emit("you_were_unblocked", {
              chatId: payload.chatId,
              unblockedByUserId: userId,
            });
          }
        }
      } catch (error: any) {
        console.error("Error unblocking user:", error);
        const errorResponse = {
          message: error.message || "Failed to unblock user",
        };

        if (callback) {
          callback({ error: errorResponse });
        }

        socket.emit("error", errorResponse);
      }
    }
  );
};
