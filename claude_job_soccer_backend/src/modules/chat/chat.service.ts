import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { Chat } from "./chat.model";
import { IChatDocument } from "./chat.interface";
import { User } from "../user/user.model";
import { Types } from "mongoose";

const createOrGetChat = async (
  user1Id: string,
  user2Id: string
): Promise<IChatDocument> => {
  // Validate users exist
  const user1 = await User.findById(user1Id);
  const user2 = await User.findById(user2Id);
 console.log("user1",user1);
 console.log("user2",user2);
  if (!user1 || !user2) {
    throw new AppError(StatusCodes.NOT_FOUND, "One or both users not found");
  }

  if (user1Id === user2Id) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Cannot create chat with yourself"
    );
  }

  // Check if chat already exists
  let chat = await Chat.getChatBetweenUsers(user1Id, user2Id);

  if (chat) {
    return chat;
  }

  // Create new chat
  chat = await Chat.create({
    users: [user1Id, user2Id],
    isBlocked: false,
  });

  return chat;
};

const getChatsByUserId = async (
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ chats: IChatDocument[]; total: number }> => {
  const skip = (page - 1) * limit;

  const chats = await Chat.find({ users: userId })
    .populate("users", "firstName lastName profileImage userType role")
    .populate({
      path: "latestMessage",
      select: "content messageType createdAt isRead senderId",
    })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .skip(skip);

  const total = await Chat.countDocuments({ users: userId });

  return { chats, total };
};

const getChatById = async (chatId: string): Promise<IChatDocument> => {
  const chat = await Chat.findById(chatId)
    .populate("users", "firstName lastName profileImage userType role")
    .populate("latestMessage");

  if (!chat) {
    throw new AppError(StatusCodes.NOT_FOUND, "Chat not found");
  }

  return chat;
};

const blockUser = async (
  chatId: string,
  blockerUserId: string
): Promise<IChatDocument> => {
  const chat = await Chat.findById(chatId);

  if (!chat) {
    throw new AppError(StatusCodes.NOT_FOUND, "Chat not found");
  }

  // Verify the blocker is part of the chat
  const isUserInChat = chat.users.some(
    (userId) => userId.toString() === blockerUserId
  );

  if (!isUserInChat) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You are not authorized to block this user"
    );
  }

  // Block the user
  chat.isBlocked = true;
  chat.blockedBy = new Types.ObjectId(blockerUserId);
  await chat.save();

  return chat;
};

const unblockUser = async (
  chatId: string,
  unblockerUserId: string
): Promise<IChatDocument> => {
  const chat = await Chat.findById(chatId);

  if (!chat) {
    throw new AppError(StatusCodes.NOT_FOUND, "Chat not found");
  }

  // Verify the unblocker is the one who blocked
  if (!chat.isBlocked) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Chat is not blocked");
  }

  if (chat.blockedBy?.toString() !== unblockerUserId) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "Only the user who blocked can unblock"
    );
  }

  // Unblock the user
  chat.isBlocked = false;
  chat.blockedBy = undefined;
  await chat.save();

  return chat;
};

const getBlockedChats = async (userId: string): Promise<IChatDocument[]> => {
  const blockedChats = await Chat.find({
    users: userId,
    isBlocked: true,
    blockedBy: userId,
  }).populate("users", "firstName lastName profileImage userType role");

  return blockedChats;
};

const deleteChat = async (
  chatId: string,
  userId: string
): Promise<{ message: string }> => {
  const chat = await Chat.findById(chatId);

  if (!chat) {
    throw new AppError(StatusCodes.NOT_FOUND, "Chat not found");
  }

  // Verify the user is part of the chat
  const isUserInChat = chat.users.some(
    (user) => user.toString() === userId
  );

  if (!isUserInChat) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You are not authorized to delete this chat"
    );
  }

  await Chat.findByIdAndDelete(chatId);

  return { message: "Chat deleted successfully" };
};

export const ChatService = {
  createOrGetChat,
  getChatsByUserId,
  getChatById,
  blockUser,
  unblockUser,
  getBlockedChats,
  deleteChat,
};
