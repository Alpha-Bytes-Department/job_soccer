import { Request, Response } from "express";
import catchAsync from "../../shared/util/catchAsync";
import sendResponse from "../../shared/util/sendResponse";
import { StatusCodes } from "http-status-codes";
import { MessageService } from "./message.service";
import { MessageType } from "./message.interface";
import AppError from "../../errors/AppError";
import { io } from "../../socket/socketServer";
import { onlineUsers } from "../../socket/socketInit";

const createMessage = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  let { chatId, receiverId, content, mediaUrl, messageType } = req.body;

  // Handle uploaded image file
  if (req.files && "image" in req.files && req.files.image[0]) {
    const imageFile = req.files.image[0];
    mediaUrl = imageFile.path.replace('/var/www/backend/claude_job_soccer_backend/uploads', '').replace(/\\/g, '/');
    messageType = MessageType.IMAGE;
  }

  // Validate that at least one of content, mediaUrl, or uploaded image is provided
  if (!content && !mediaUrl) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "At least one of content, mediaUrl, or image file must be provided"
    );
  }

  // Set default messageType if not provided
  if (!messageType) {
    messageType = content && !mediaUrl ? MessageType.TEXT : MessageType.IMAGE;
  }

  const message = await MessageService.createMessage({
    chatId,
    senderId: userId,
    receiverId,
    content,
    mediaUrl,
    messageType,
  });
  console.log("res------->",message);

  // Emit Socket.IO events for real-time delivery
  // Find receiver's socket and send message
  const receiverSocketId = Array.from(onlineUsers.values()).find(
    (user) => user.userId === receiverId
  )?.socketId;

  if (receiverSocketId) {
    io.to(receiverSocketId).emit("new_message", {
      message,
    });
    
    // Notify receiver to update chat list
    io.to(receiverSocketId).emit("chat_updated", {
      chatId,
    });
  }

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Message sent successfully",
    data: message,
  });
});

const getMessagesByChatId = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { chatId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;

  const result = await MessageService.getMessagesByChatId(
    chatId,
    userId,
    page,
    limit
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Messages retrieved successfully",
    data: result.messages,
    meta: {
      page,
      limit,
      total: result.total,
      totalPage: Math.ceil(result.total / limit),
    },
  });
});

const markMessagesAsRead = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { chatId } = req.params;

  const result = await MessageService.markMessagesAsRead(chatId, userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

const deleteMessage = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { messageId } = req.params;

  const result = await MessageService.deleteMessage(messageId, userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

const getUnreadMessageCount = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user.id;

    const count = await MessageService.getUnreadMessageCount(userId);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Unread message count retrieved successfully",
      data: { count },
    });
  }
);

const searchMessages = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { chatId } = req.params;
  const { searchTerm } = req.query;

  const messages = await MessageService.searchMessages(
    chatId,
    userId,
    searchTerm as string
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Messages retrieved successfully",
    data: messages,
  });
});

export const MessageController = {
  createMessage,
  getMessagesByChatId,
  markMessagesAsRead,
  deleteMessage,
  getUnreadMessageCount,
  searchMessages,
};
