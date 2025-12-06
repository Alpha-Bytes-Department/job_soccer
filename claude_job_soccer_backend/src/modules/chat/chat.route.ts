import { Router } from "express";
import auth from "../../shared/middlewares/auth";
import { ChatController } from "./chat.controller";
import validateRequest from "../../shared/middlewares/validateRequest";
import { z } from "zod";

const router = Router();

/**
 * Validation schemas
 */
const createOrGetChatSchema = z.object({
  body: z.object({
    otherUserId: z.string().min(1, "Other user ID is required"),
  }),
});

/**
 * POST /api/v1/chat/create-or-get
 * Create a new chat or get existing chat between two users
 * Body:
 *   - otherUserId: string (required) - The ID of the other user to chat with
 * Auth: Required (candidate, employer)
 * Response: Chat object with participants and latest message
 */
router.post(
  "/create-or-get",
  auth("candidate", "employer"),
  validateRequest(createOrGetChatSchema),
  ChatController.createOrGetChat
);

/**
 * GET /api/v1/chat/my-chats
 * Get all chats for the authenticated user
 * Auth: Required (candidate, employer)
 * Response: Array of chat objects with participant info and unread counts
 */
router.get(
  "/my-chats",
  auth("candidate", "employer"),
  ChatController.getUserChats
);

/**
 * GET /api/v1/chat/blocked
 * Get all blocked chats for the authenticated user
 * Auth: Required (candidate, employer)
 * Response: Array of blocked chat objects
 */
router.get(
  "/blocked",
  auth("candidate", "employer"),
  ChatController.getBlockedChats
);

/**
 * GET /api/v1/chat/:chatId
 * Get a specific chat by ID with full details
 * Params:
 *   - chatId: string (required) - The ID of the chat to retrieve
 * Auth: Required (candidate, employer)
 * Response: Chat object with participants and messages
 */
router.get(
  "/:chatId",
  auth("candidate", "employer"),
  ChatController.getChatById
);

/**
 * POST /api/v1/chat/:chatId/block
 * Block a user in a specific chat
 * Params:
 *   - chatId: string (required) - The ID of the chat
 * Auth: Required (candidate, employer)
 * Response: Updated chat object with blocked status
 */
router.post(
  "/:chatId/block",
  auth("candidate", "employer"),
  ChatController.blockUser
);

/**
 * POST /api/v1/chat/:chatId/unblock
 * Unblock a user in a specific chat
 * Params:
 *   - chatId: string (required) - The ID of the chat
 * Auth: Required (candidate, employer)
 * Response: Updated chat object with unblocked status
 */
router.post(
  "/:chatId/unblock",
  auth("candidate", "employer"),
  ChatController.unblockUser
);

/**
 * DELETE /api/v1/chat/:chatId
 * Delete a specific chat
 * Params:
 *   - chatId: string (required) - The ID of the chat to delete
 * Auth: Required (candidate, employer)
 * Response: Success message
 */
router.delete(
  "/:chatId",
  auth("candidate", "employer"),
  ChatController.deleteChat
);

export const ChatRoutes: Router = router;
