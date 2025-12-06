import { Types } from "mongoose";
import { Notification } from "./notification.model";
import { TNotification } from "./notification.interface";
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import { io } from "../../socket/socketServer";
import { isUserOnline, getSocketIdByUserId } from "../../socket/socketUtils";

/**
 * Create a new notification and send via socket if user is online
 */
const createNotification = async (
  title: string,
  description: string,
  userId: string
): Promise<TNotification> => {
  const notification = await Notification.create({
    title,
    description,
    userId: new Types.ObjectId(userId),
    isRead: false,
  });

  // Send real-time notification if user is online
  if (isUserOnline(userId)) {
    const socketId = getSocketIdByUserId(userId);
    if (socketId && io) {
      io.to(socketId).emit("new_notification", {
        success: true,
        notification: notification.toObject(),
      });
    }
  }

  return notification.toObject();
};

/**
 * Get all notifications for a user with pagination
 */
const getNotifications = async (
  userId: string,
  query: Record<string, any>
): Promise<{
  data: TNotification[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    unreadCount: number;
  };
}> => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build filter
  const filter: any = {
    userId: new Types.ObjectId(userId),
  };

  // Optional filter for read/unread
  if (query.isRead !== undefined) {
    filter.isRead = query.isRead === "true";
  }

  // Get total count
  const total = await Notification.countDocuments(filter);

  // Get unread count
  const unreadCount = await Notification.countDocuments({
    userId: new Types.ObjectId(userId),
    isRead: false,
  });

  // Get paginated data
  const data = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const totalPages = Math.ceil(total / limit);

  return {
    data: data as TNotification[],
    meta: {
      page,
      limit,
      total,
      totalPages,
      unreadCount,
    },
  };
};

/**
 * Get a single notification by ID
 */
const getNotificationById = async (
  notificationId: string,
  userId: string
): Promise<TNotification> => {
  const notification = await Notification.findOne({
    _id: new Types.ObjectId(notificationId),
    userId: new Types.ObjectId(userId),
  }).lean();

  if (!notification) {
    throw new AppError(StatusCodes.NOT_FOUND, "Notification not found");
  }

  return notification as TNotification;
};

/**
 * Mark a single notification as read
 */
const markAsRead = async (
  notificationId: string,
  userId: string
): Promise<TNotification> => {
  const notification = await Notification.findOneAndUpdate(
    {
      _id: new Types.ObjectId(notificationId),
      userId: new Types.ObjectId(userId),
    },
    { isRead: true },
    { new: true }
  ).lean();

  if (!notification) {
    throw new AppError(StatusCodes.NOT_FOUND, "Notification not found");
  }

  return notification as TNotification;
};

/**
 * Mark all notifications as read for a user
 */
const markAllAsRead = async (userId: string): Promise<{ modifiedCount: number }> => {
  const result = await Notification.updateMany(
    {
      userId: new Types.ObjectId(userId),
      isRead: false,
    },
    { isRead: true }
  );

  return { modifiedCount: result.modifiedCount };
};

/**
 * Delete a single notification
 */
const deleteNotification = async (
  notificationId: string,
  userId: string
): Promise<void> => {
  const result = await Notification.findOneAndDelete({
    _id: new Types.ObjectId(notificationId),
    userId: new Types.ObjectId(userId),
  });

  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Notification not found");
  }
};

/**
 * Delete all notifications for a user
 */
const deleteAllNotifications = async (userId: string): Promise<{ deletedCount: number }> => {
  const result = await Notification.deleteMany({
    userId: new Types.ObjectId(userId),
  });

  return { deletedCount: result.deletedCount };
};

/**
 * Get unread notification count for a user
 */
const getUnreadCount = async (userId: string): Promise<number> => {
  const count = await Notification.countDocuments({
    userId: new Types.ObjectId(userId),
    isRead: false,
  });

  return count;
};

/**
 * Send notification to user (helper function for other modules)
 * This can be called from other services to create and send notifications
 */
const sendNotificationToUser = async (
  userId: string,
  title: string,
  description: string
): Promise<TNotification> => {
  return createNotification(title, description, userId);
};

export const NotificationService = {
  createNotification,
  getNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getUnreadCount,
  sendNotificationToUser,
};
