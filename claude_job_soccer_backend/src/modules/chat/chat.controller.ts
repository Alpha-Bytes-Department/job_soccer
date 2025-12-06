import { Request, Response } from "express";
import catchAsync from "../../shared/util/catchAsync";
import sendResponse from "../../shared/util/sendResponse";
import { StatusCodes } from "http-status-codes";
import { ChatService } from "./chat.service";

const createOrGetChat = catchAsync(async (req: Request, res: Response) => {
  const { otherUserId } = req.body;
  const userId = req.user.id;
  console.log(otherUserId,userId,"from controller");

  const chat = await ChatService.createOrGetChat(userId, otherUserId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Chat retrieved successfully",
    data: chat,
  });
});

const getUserChats = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const result = await ChatService.getChatsByUserId(userId, page, limit);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Chats retrieved successfully",
    data: result.chats,
    meta: {
      page,
      limit,
      total: result.total,
      totalPage: Math.ceil(result.total / limit),
    },
  });
});

const getChatById = catchAsync(async (req: Request, res: Response) => {
  const { chatId } = req.params;

  const chat = await ChatService.getChatById(chatId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Chat retrieved successfully",
    data: chat,
  });
});

const blockUser = catchAsync(async (req: Request, res: Response) => {
  const { chatId } = req.params;
  const userId = req.user.id;

  const chat = await ChatService.blockUser(chatId, userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User blocked successfully",
    data: chat,
  });
});

const unblockUser = catchAsync(async (req: Request, res: Response) => {
  const { chatId } = req.params;
  const userId = req.user.id;

  const chat = await ChatService.unblockUser(chatId, userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User unblocked successfully",
    data: chat,
  });
});

const getBlockedChats = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;

  const blockedChats = await ChatService.getBlockedChats(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Blocked chats retrieved successfully",
    data: blockedChats,
  });
});

const deleteChat = catchAsync(async (req: Request, res: Response) => {
  const { chatId } = req.params;
  const userId = req.user.id;

  const result = await ChatService.deleteChat(chatId, userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

export const ChatController = {
  createOrGetChat,
  getUserChats,
  getChatById,
  blockUser,
  unblockUser,
  getBlockedChats,
  deleteChat,
};
