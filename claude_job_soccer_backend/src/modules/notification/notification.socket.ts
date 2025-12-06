import { io } from "../../socket/socketServer";
import { isUserOnline, getSocketIdByUserId, emitToUser } from "../../socket/socketUtils";
import { NotificationService } from "./notification.service";
import { TNotification } from "./notification.interface";

/**
 * Send a notification to a user
 * Creates the notification in DB and sends via socket if user is online
 */
export const sendNotification = async (
  userId: string,
  title: string,
  description: string
): Promise<TNotification> => {
  // Create notification in database
  const notification = await NotificationService.sendNotificationToUser(
    userId,
    title,
    description
  );

  return notification;
};

/**
 * Send notification to multiple users
 */
export const sendNotificationToMultipleUsers = async (
  userIds: string[],
  title: string,
  description: string
): Promise<TNotification[]> => {
  const notifications: TNotification[] = [];

  for (const userId of userIds) {
    const notification = await sendNotification(userId, title, description);
    notifications.push(notification);
  }

  return notifications;
};

/**
 * Emit a socket event to a user if they are online (without creating DB notification)
 * Useful for real-time updates that don't need to be persisted
 */
export const emitToUserIfOnline = (
  userId: string,
  event: string,
  data: any
): boolean => {
  if (io && isUserOnline(userId)) {
    return emitToUser(io, userId, event, data);
  }
  return false;
};

/**
 * Emit a socket event to multiple users
 */
export const emitToMultipleUsersIfOnline = (
  userIds: string[],
  event: string,
  data: any
): number => {
  let sentCount = 0;
  for (const userId of userIds) {
    if (emitToUserIfOnline(userId, event, data)) {
      sentCount++;
    }
  }
  return sentCount;
};

/**
 * Send notification count update to user
 * Call this after creating new notifications to update the badge count
 */
export const sendUnreadCountUpdate = async (userId: string): Promise<void> => {
  const unreadCount = await NotificationService.getUnreadCount(userId);

  if (io && isUserOnline(userId)) {
    const socketId = getSocketIdByUserId(userId);
    if (socketId) {
      io.to(socketId).emit("notification_count_update", {
        success: true,
        unreadCount,
      });
    }
  }
};
