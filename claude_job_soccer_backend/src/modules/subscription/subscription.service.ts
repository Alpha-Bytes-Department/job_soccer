import mongoose from "mongoose";
import config from "../../config";
import { stripe } from "../../config/stripe.config";
import AppError from "../../errors/AppError";
import { User } from "../user/user.model";
import { Subscription } from "./subscription.model";
export const createCheckoutSession = async (
  userId: string,
  priceId: string
) => {
  try {
    console.log("------------------------>>>>>>>>>>>>>>", userId);
    const user = await User.findById(new mongoose.Types.ObjectId(userId));
    let customerId = user!.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user!.email,
        metadata: { userId },
      });

      customerId = customer.id;
      user!.stripeCustomerId = customer.id;
      await user!.save();
    }

    console.log("-------------------------->", customerId);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${config.frontend_url}/success`,
      cancel_url: `${config.frontend_url}/cancel`,
    });

    return session.url;
  } catch (error) {
    console.log(error);
    throw new AppError(500, "Failed to create checkout session");
  }
};

const upsertStripeSubscription = async (stripeSub: any, metadata?: any) => {
  console.log("---------------------------> Processing Stripe Subscription:", stripeSub.id, "<-------------------------");
  
  const customerId = stripeSub.customer;

  const user = await User.findOne({ stripeCustomerId: customerId });
  if (!user) return;

  let subscription = await Subscription.findOne({
    stripeSubscriptionId: stripeSub.id,
  });
  
  if (!subscription) {
    console.log("---------------------------> Creating new subscription for user:", user._id, "<-------------------------");
    const stripeInterval = stripeSub.items.data[0].price.recurring.interval;
    const stripeIntervalCount = stripeSub.items.data[0].price.recurring.interval_count;
    
    // Map Stripe interval to our custom format
    let interval: string;
    if (stripeInterval === "month" && stripeIntervalCount === 1) {
      interval = "monthly";
    } else if (stripeInterval === "month" && stripeIntervalCount === 6) {
      interval = "halfYearly";
    } else if (stripeInterval === "year" && stripeIntervalCount === 1) {
      interval = "yearly";
    } else {
      interval = "monthly"; // fallback
    }
    
    subscription = await Subscription.create({
      user: user._id,
      stripeSubscriptionId: stripeSub.id,
      stripePriceId: stripeSub.items.data[0].price.id,
      interval: interval,
      intervalCount: stripeIntervalCount,
    });

    // If this is an upgrade, cancel the old subscription
    if (metadata?.isUpgrade === "true" && metadata?.oldSubscriptionId) {
      try {
        await stripe.subscriptions.cancel(metadata.oldSubscriptionId);
        console.log("---------------------------> Canceled old subscription:", metadata.oldSubscriptionId, "<-------------------------");
      } catch (error) {
        console.error("Failed to cancel old subscription:", error);
      }
    }
  }

  subscription.status = stripeSub.status;
  
  // Get period dates from the subscription item (Stripe stores them there)
  const currentPeriodStart = stripeSub.current_period_start || 
    stripeSub.items?.data?.[0]?.current_period_start;
  let currentPeriodEnd = stripeSub.current_period_end || 
    stripeSub.items?.data?.[0]?.current_period_end;
  
  // Only update period dates if they exist (they may be undefined for incomplete subscriptions)
  if (currentPeriodStart) {
    subscription.currentPeriodStart = new Date(currentPeriodStart * 1000);
  }
  
  if (currentPeriodEnd) {
    let endDate = new Date(currentPeriodEnd * 1000);

    // If this is an upgrade, add remaining days from old subscription
    if (metadata?.isUpgrade === "true" && metadata?.remainingDays) {
      const remainingDays = parseInt(metadata.remainingDays, 10);
      if (remainingDays > 0) {
        endDate = new Date(endDate.getTime() + remainingDays * 24 * 60 * 60 * 1000);
        console.log("---------------------------> Extended subscription by", remainingDays, "days. New end date:", endDate, "<-------------------------");
      }
    }

    subscription.currentPeriodEnd = endDate;
  }

  await subscription.save();

  user.activeSubscriptionId = subscription._id;

  await user.save();
};

const getCurrentSubscription = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (!user.activeSubscriptionId) {
    return {
      hasActiveSubscription: false,
      subscription: null,
    };
  }

  const subscription = await Subscription.findById(user.activeSubscriptionId);
  
  if (!subscription) {
    return {
      hasActiveSubscription: false,
      subscription: null,
    };
  }

  const isActive =
    subscription.status === "active" &&
    subscription.currentPeriodEnd &&
    new Date(subscription.currentPeriodEnd) > new Date();

  return {
    hasActiveSubscription: isActive,
    subscription: {
      interval: subscription.interval,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      remainingDays: subscription.currentPeriodEnd
        ? Math.max(
            0,
            Math.ceil(
              (new Date(subscription.currentPeriodEnd).getTime() -
                new Date().getTime()) /
                (1000 * 60 * 60 * 24)
            )
          )
        : 0,
    },
  };
};

export const SubscriptionServices = {
  upsertStripeSubscription,
  getCurrentSubscription,
};
