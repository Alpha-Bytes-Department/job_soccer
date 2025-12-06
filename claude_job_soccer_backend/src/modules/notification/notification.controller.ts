import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { NotificationService } from "./notification.service";
import catchAsync from "../../shared/util/catchAsync";
import sendResponse from "../../shared/util/sendResponse";

/**
 * Create a new notification (Admin only)
 * POST /api/v1/notifications
 */
const createNotification = catchAsync(async (req: Request, res: Response) => {
  const { title, description, userId } = req.body;

  const result = await NotificationService.createNotification(
    title,
    description,
    userId
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Notification created successfully",
    data: result,
  });
});

/**
 * Get all notifications for the authenticated user
 * GET /api/v1/notifications
 */
const getNotifications = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  const result = await NotificationService.getNotifications(userId!, req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Notifications retrieved successfully",
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
 * Get a single notification by ID
 * GET /api/v1/notifications/:notificationId
 */
const getNotificationById = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { notificationId } = req.params;

  const result = await NotificationService.getNotificationById(
    notificationId,
    userId!
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Notification retrieved successfully",
    data: result,
  });
});

/**
 * Mark a single notification as read
 * PATCH /api/v1/notifications/:notificationId/read
 */
const markAsRead = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { notificationId } = req.params;

  const result = await NotificationService.markAsRead(notificationId, userId!);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Notification marked as read",
    data: result,
  });
});

/**
 * Mark all notifications as read for the authenticated user
 * PATCH /api/v1/notifications/read-all
 */
const markAllAsRead = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  const result = await NotificationService.markAllAsRead(userId!);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `${result.modifiedCount} notifications marked as read`,
    data: result,
  });
});

/**
 * Delete a single notification
 * DELETE /api/v1/notifications/:notificationId
 */
const deleteNotification = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { notificationId } = req.params;

  await NotificationService.deleteNotification(notificationId, userId!);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Notification deleted successfully",
    data: null,
  });
});

/**
 * Delete all notifications for the authenticated user
 * DELETE /api/v1/notifications/all
 */
const deleteAllNotifications = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  const result = await NotificationService.deleteAllNotifications(userId!);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `${result.deletedCount} notifications deleted`,
    data: result,
  });
});

/**
 * Get unread notification count for the authenticated user
 * GET /api/v1/notifications/unread-count
 */
const getUnreadCount = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  const count = await NotificationService.getUnreadCount(userId!);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Unread count retrieved successfully",
    data: { unreadCount: count },
  });
});

export const NotificationController = {
  createNotification,
  getNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getUnreadCount,
};
