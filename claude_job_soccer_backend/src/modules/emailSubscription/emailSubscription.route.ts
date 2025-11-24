import express, { Router } from "express";
import { EmailSubscriptionController } from "./emailSubscription.controller";
import auth from "../../shared/middlewares/auth";
import validateRequest from "../../shared/middlewares/validateRequest";
import {
  subscribeEmailSchema,
  unsubscribeEmailSchema,
} from "./emailSubscription.dto";
import { UserType } from "../user/user.interface";

const router: Router = express.Router();

/**
 * @route   POST /api/v1/email-subscriptions/subscribe
 * @desc    Subscribe an email to the newsletter
 * @access  Public
 */
router.post(
  "/subscribe",
  validateRequest(subscribeEmailSchema),
  EmailSubscriptionController.subscribeEmail
);

/**
 * @route   POST /api/v1/email-subscriptions/unsubscribe
 * @desc    Unsubscribe an email from the newsletter
 * @access  Public
 */
router.post(
  "/unsubscribe",
  validateRequest(unsubscribeEmailSchema),
  EmailSubscriptionController.unsubscribeEmail
);

/**
 * @route   GET /api/v1/email-subscriptions
 * @desc    Get all email subscriptions with pagination
 * @access  Private (Admin only)
 * @query   page, limit, search
 */
router.get(
  "/",
  auth(UserType.ADMIN),
  EmailSubscriptionController.getAllSubscriptions
);

/**
 * @route   GET /api/v1/email-subscriptions/count
 * @desc    Get total count of email subscriptions
 * @access  Private (Admin only)
 */
router.get(
  "/count",
  auth(UserType.ADMIN),
  EmailSubscriptionController.getSubscriptionCount
);

/**
 * @route   GET /api/v1/email-subscriptions/check/:email
 * @desc    Check if an email is subscribed
 * @access  Public
 */
router.get(
  "/check/:email",
  EmailSubscriptionController.checkIfEmailSubscribed
);

export default router;
