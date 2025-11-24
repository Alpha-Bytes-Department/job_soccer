import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { EmailSubscription } from "./emailSubscription.model";
import { TEmailSubscription } from "./emailSubscription.interface";

/**
 * Subscribe an email to the newsletter
 */
const subscribeEmail = async (email: string): Promise<TEmailSubscription> => {
  // Check if email is already subscribed
  const existingSubscription = await EmailSubscription.findOne({ email });

  if (existingSubscription) {
    throw new AppError(
      StatusCodes.CONFLICT,
      "This email is already subscribed"
    );
  }

  // Create new subscription
  const subscription = await EmailSubscription.create({ email });

  return subscription;
};

/**
 * Unsubscribe an email from the newsletter
 */
const unsubscribeEmail = async (email: string): Promise<void> => {
  const result = await EmailSubscription.findOneAndDelete({ email });

  if (!result) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "Email subscription not found"
    );
  }
};

/**
 * Get all email subscriptions with pagination
 */
const getAllSubscriptions = async (
  query: Record<string, any>
): Promise<{
  data: TEmailSubscription[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build filter
  const filter: any = {};

  // Optional search by email
  if (query.search) {
    filter.email = { $regex: query.search, $options: "i" };
  }

  // Get total count
  const total = await EmailSubscription.countDocuments(filter);

  // Get subscriptions with pagination
  const subscriptions = await EmailSubscription.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    data: subscriptions,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get total count of email subscriptions
 */
const getSubscriptionCount = async (): Promise<number> => {
  const count = await EmailSubscription.countDocuments();
  return count;
};

/**
 * Check if an email is subscribed
 */
const isEmailSubscribed = async (email: string): Promise<boolean> => {
  const subscription = await EmailSubscription.findOne({ email });
  return !!subscription;
};

export const EmailSubscriptionService = {
  subscribeEmail,
  unsubscribeEmail,
  getAllSubscriptions,
  getSubscriptionCount,
  isEmailSubscribed,
};
