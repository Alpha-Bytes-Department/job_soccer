import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { FriendListService } from "./friendlist.service";
import catchAsync from "../../shared/util/catchAsync";
import sendResponse from "../../shared/util/sendResponse";

/**
 * Send a friend request
 * POST /api/v1/friendlist
 */
const sendFriendRequest = catchAsync(async (req: Request, res: Response) => {
  const senderId = req.user?.id;
  const senderType = req.user?.userType as "candidate" | "employer";
  const senderRole = req.user?.role;
  const { receiverId } = req.body;

  const result = await FriendListService.sendFriendRequest(
    senderId!,
    senderType,
    senderRole!,
    receiverId
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Friend request sent successfully",
    data: result,
  });
});

/**
 * Respond to a friend request (accept or reject)
 * PATCH /api/v1/friendlist/:requestId
 */
const respondToFriendRequest = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { requestId } = req.params;
    const { status } = req.body;

    const result = await FriendListService.respondToFriendRequest(
      userId!,
      requestId,
      status
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: `Friend request ${status} successfully`,
      data: result,
    });
  }
);

/**
 * Get all friend requests received by the authenticated user
 * GET /api/v1/friendlist/received
 */
const getReceivedFriendRequests = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    const result = await FriendListService.getReceivedFriendRequests(
      userId!,
      req.query
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Received friend requests retrieved successfully",
      data: result.data,
      meta: {
        page: result.meta.page,
        limit: result.meta.limit,
        totalPage: result.meta.totalPages,
        total: result.meta.total,
      },
    });
  }
);

/**
 * Get all friend requests sent by the authenticated user
 * GET /api/v1/friendlist/sent
 */
const getSentFriendRequests = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    const result = await FriendListService.getSentFriendRequests(
      userId!,
      req.query
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Sent friend requests retrieved successfully",
      data: result.data,
      meta: {
        page: result.meta.page,
        limit: result.meta.limit,
        totalPage: result.meta.totalPages,
        total: result.meta.total,
      },
    });
  }
);

/**
 * Get all friends of the authenticated user
 * GET /api/v1/friendlist/friends
 */
const getFriends = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  console.log(userId!, req.query);

  const result = await FriendListService.getFriends(userId!, req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Friends list retrieved successfully",
    data: result.data,
    meta: {
      page: result.meta.page,
      limit: result.meta.limit,
      totalPage: result.meta.totalPages,
      total: result.meta.total,
    },
  });
});

/**
 * Remove a friend
 * DELETE /api/v1/friendlist/friends/:friendId
 */
const removeFriend = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { friendId } = req.params;

  await FriendListService.removeFriend(userId!, friendId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Friend removed successfully",
    data: null,
  });
});

/**
 * Cancel a sent friend request
 * DELETE /api/v1/friendlist/:requestId
 */
const cancelFriendRequest = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { requestId } = req.params;

  await FriendListService.cancelFriendRequest(userId!, requestId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Friend request cancelled successfully",
    data: null,
  });
});

/**
 * Check friendship status with another user
 * GET /api/v1/friendlist/check/:userId
 */
const checkFriendship = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { userId: otherUserId } = req.params;

  const result = await FriendListService.checkFriendship(userId!, otherUserId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Friendship status retrieved successfully",
    data: result,
  });
});

/**
 * Get friends count
 * GET /api/v1/friendlist/friends/count
 */
const getFriendsCount = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  const count = await FriendListService.getFriendsCount(userId!);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Friends count retrieved successfully",
    data: { count },
  });
});

/**
 * Get pending requests count
 * GET /api/v1/friendlist/received/count
 */
const getPendingRequestsCount = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const count = await FriendListService.getPendingRequestsCount(userId!);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Pending requests count retrieved successfully",
      data: { count },
    });
  }
);

export const FriendListController = {
  sendFriendRequest,
  respondToFriendRequest,
  getReceivedFriendRequests,
  getSentFriendRequests,
  getFriends,
  removeFriend,
  cancelFriendRequest,
  checkFriendship,
  getFriendsCount,
  getPendingRequestsCount,
};
