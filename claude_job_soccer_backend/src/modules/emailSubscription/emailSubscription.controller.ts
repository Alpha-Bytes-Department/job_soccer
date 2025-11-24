import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { EmailSubscriptionService } from "./emailSubscription.service";
import catchAsync from "../../shared/util/catchAsync";
import sendResponse from "../../shared/util/sendResponse";

/**
 * Subscribe an email to the newsletter
 * POST /api/v1/email-subscriptions/subscribe
 */
const subscribeEmail = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;

  const result = await EmailSubscriptionService.subscribeEmail(email);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Successfully subscribed to newsletter",
    data: result,
  });
});

/**
 * Unsubscribe an email from the newsletter
 * POST /api/v1/email-subscriptions/unsubscribe
 */
const unsubscribeEmail = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;

  await EmailSubscriptionService.unsubscribeEmail(email);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Successfully unsubscribed from newsletter",
    data: null,
  });
});

/**
 * Get all email subscriptions (Admin only)
 * GET /api/v1/email-subscriptions
 */
const getAllSubscriptions = catchAsync(async (req: Request, res: Response) => {
  const result = await EmailSubscriptionService.getAllSubscriptions(req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Email subscriptions retrieved successfully",
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
 * Get total count of email subscriptions (Admin only)
 * GET /api/v1/email-subscriptions/count
 */
const getSubscriptionCount = catchAsync(
  async (req: Request, res: Response) => {
    const count = await EmailSubscriptionService.getSubscriptionCount();

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Subscription count retrieved successfully",
      data: { count },
    });
  }
);

/**
 * Check if an email is subscribed
 * GET /api/v1/email-subscriptions/check/:email
 */
const checkIfEmailSubscribed = catchAsync(
  async (req: Request, res: Response) => {
    const { email } = req.params;

    const isSubscribed = await EmailSubscriptionService.isEmailSubscribed(
      email
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Email subscription status retrieved successfully",
      data: { isSubscribed },
    });
  }
);

export const EmailSubscriptionController = {
  subscribeEmail,
  unsubscribeEmail,
  getAllSubscriptions,
  getSubscriptionCount,
  checkIfEmailSubscribed,
};
