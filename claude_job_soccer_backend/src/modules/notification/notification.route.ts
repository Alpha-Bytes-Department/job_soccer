import express, { Router } from "express";
import { NotificationController } from "./notification.controller";
import auth from "../../shared/middlewares/auth";
import validateRequest from "../../shared/middlewares/validateRequest";
import {
  createNotificationSchema,
  getNotificationByIdSchema,
  markAsReadSchema,
  deleteNotificationSchema,
} from "./notification.dto";
import { UserType } from "../user/user.interface";

const router: Router = express.Router();

/**
 * @route   POST /api/v1/notifications
 * @desc    Create a new notification (Admin only)
 * @access  Private (Admin)
 */
router.post(
  "/",
  auth(UserType.ADMIN),
  validateRequest(createNotificationSchema),
  NotificationController.createNotification
);

/**
 * @route   GET /api/v1/notifications
 * @desc    Get all notifications for the authenticated user
 * @access  Private (Candidate, Employer, Admin)
 * @query   page, limit, isRead
 */
router.get(
  "/",
  auth(UserType.CANDIDATE, UserType.EMPLOYER, UserType.ADMIN),
  NotificationController.getNotifications
);

/**
 * @route   GET /api/v1/notifications/unread-count
 * @desc    Get unread notification count for the authenticated user
 * @access  Private (Candidate, Employer, Admin)
 */
router.get(
  "/unread-count",
  auth(UserType.CANDIDATE, UserType.EMPLOYER, UserType.ADMIN),
  NotificationController.getUnreadCount
);

/**
 * @route   PATCH /api/v1/notifications/read-all
 * @desc    Mark all notifications as read for the authenticated user
 * @access  Private (Candidate, Employer, Admin)
 */
router.patch(
  "/read-all",
  auth(UserType.CANDIDATE, UserType.EMPLOYER, UserType.ADMIN),
  NotificationController.markAllAsRead
);

/**
 * @route   DELETE /api/v1/notifications/all
 * @desc    Delete all notifications for the authenticated user
 * @access  Private (Candidate, Employer, Admin)
 */
router.delete(
  "/all",
  auth(UserType.CANDIDATE, UserType.EMPLOYER, UserType.ADMIN),
  NotificationController.deleteAllNotifications
);

/**
 * @route   GET /api/v1/notifications/:notificationId
 * @desc    Get a single notification by ID
 * @access  Private (Candidate, Employer, Admin)
 */
router.get(
  "/:notificationId",
  auth(UserType.CANDIDATE, UserType.EMPLOYER, UserType.ADMIN),
  validateRequest(getNotificationByIdSchema),
  NotificationController.getNotificationById
);

/**
 * @route   PATCH /api/v1/notifications/:notificationId/read
 * @desc    Mark a single notification as read
 * @access  Private (Candidate, Employer, Admin)
 */
router.patch(
  "/:notificationId/read",
  auth(UserType.CANDIDATE, UserType.EMPLOYER, UserType.ADMIN),
  validateRequest(markAsReadSchema),
  NotificationController.markAsRead
);

/**
 * @route   DELETE /api/v1/notifications/:notificationId
 * @desc    Delete a single notification
 * @access  Private (Candidate, Employer, Admin)
 */
router.delete(
  "/:notificationId",
  auth(UserType.CANDIDATE, UserType.EMPLOYER, UserType.ADMIN),
  validateRequest(deleteNotificationSchema),
  NotificationController.deleteNotification
);

export const NotificationRoutes = router;
