import mongoose from "mongoose";
import config from "../../config";
import { stripe } from "../../config/stripe.config";
import AppError from "../../errors/AppError";
import { User } from "../user/user.model";
import { Subscription } from "./subscription.model";
import { STRIPE_PRICES } from "./subscription.constant";
// Define subscription hierarchy for upgrades
const SUBSCRIPTION_HIERARCHY = {
  monthly: 1,
  halfYearly: 2,
  yearly: 3,
};

// Helper function to get interval from price ID
const getIntervalFromPriceId = (priceId: string): string => {
  const priceEntry = Object.entries(STRIPE_PRICES).find(
    ([_, id]) => id === priceId
  );
  return priceEntry ? priceEntry[0] : "monthly";
};

export const createCheckoutSession = async (
  userId: string,
  priceId: string
) => {
  try {
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

    // Check for existing active subscription
    const existingSubscription = await Subscription.findOne({
      user: user!._id,
      status: { $in: ["active", "trialing"] },
    });

    const newInterval = getIntervalFromPriceId(priceId);
    let remainingDays = 0;

    if (existingSubscription) {
      const currentInterval = existingSubscription.interval;
      const currentLevel = SUBSCRIPTION_HIERARCHY[currentInterval as keyof typeof SUBSCRIPTION_HIERARCHY];
      const newLevel = SUBSCRIPTION_HIERARCHY[newInterval as keyof typeof SUBSCRIPTION_HIERARCHY];

      console.log(`
      🔍 Existing subscription found:
         Current: ${currentInterval} (Level: ${currentLevel})
         Requested: ${newInterval} (Level: ${newLevel})
      `);

      // Check if it's the same subscription level
      if (currentLevel === newLevel) {
        throw new AppError(
          400,
          `You already have an active ${currentInterval} subscription. Please wait for it to expire or cancel it before purchasing the same plan.`
        );
      }

      // Check if it's a downgrade
      if (newLevel < currentLevel) {
        throw new AppError(
          400,
          `Cannot downgrade from ${currentInterval} to ${newInterval}. Please wait for your current subscription to expire, then purchase a new plan.`
        );
      }

      // Calculate remaining days from current subscription
      if (existingSubscription.currentPeriodEnd) {
        const now = new Date();
        const endDate = new Date(existingSubscription.currentPeriodEnd);
        remainingDays = Math.max(
          0,
          Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        );
      }

      console.log(`✅ Upgrade allowed: ${currentInterval} → ${newInterval}`);
      console.log(`📅 Remaining days from current subscription: ${remainingDays}`);
    }

    // Build checkout session options
    const sessionOptions: any = {
      mode: "subscription",
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${config.frontend_url}/success`,
      cancel_url: `${config.frontend_url}/cancel`,
      metadata: {
        userId,
        isUpgrade: existingSubscription ? "true" : "false",
        oldSubscriptionId: existingSubscription?.stripeSubscriptionId || "",
        remainingDays: remainingDays.toString(),
        upgradedFrom: existingSubscription?.interval || "",
      },
    };

    // If upgrading, add remaining days as trial period
    // This ensures Stripe billing aligns with actual subscription period
    if (existingSubscription && remainingDays > 0) {
      sessionOptions.subscription_data = {
        trial_period_days: remainingDays,
        metadata: {
          userId,
          isUpgrade: "true",
          oldSubscriptionId: existingSubscription.stripeSubscriptionId,
          remainingDays: remainingDays.toString(),
          upgradedFrom: existingSubscription.interval,
        },
      };
      console.log(`🎁 Adding ${remainingDays} days trial period for upgrade`);
    }

    const session = await stripe.checkout.sessions.create(sessionOptions);
    console.log(`
    ---------------------------------------  Passed checkout service [ Line 34 ] ---------------------------------------
    `);
    return session.url;
  } catch (error) {
    console.log(error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(500, "Failed to create checkout session");
  }
};

const upsertStripeSubscription = async (stripeSub: any, metadata?: any) => {
  const customerId = stripeSub.customer;

  const user = await User.findOne({ stripeCustomerId: customerId });
  if (!user) return;

  let subscription = await Subscription.findOne({
    stripeSubscriptionId: stripeSub.id,
  });

  if (!subscription) {
    console.log(
      "---------------------------> Creating new subscription for user:",
      user._id,
      "<-------------------------"
    );
    const stripeInterval = stripeSub.items.data[0].price.recurring.interval;
    const stripeIntervalCount =
      stripeSub.items.data[0].price.recurring.interval_count;

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
    console.log(`
      ---------------------------------------  create subscription [ Line 75 ] ---------------------------------------
      `);

    console.log({
      user: user._id,
      stripeSubscriptionId: stripeSub.id,
      stripePriceId: stripeSub.items.data[0].price.id,
      interval: interval,
      intervalCount: stripeIntervalCount,
    });

    console.log(` 
        ------------------------  meta data ----------------------------------
        `);
    console.log(metadata);

    console.log(`---------------------------------------------------`);
    
    // Prepare subscription data with upgrade tracking
    const subscriptionData: any = {
      user: user._id,
      stripeSubscriptionId: stripeSub.id,
      stripePriceId: stripeSub.items.data[0].price.id,
      interval: interval,
      intervalCount: stripeIntervalCount,
    };

    // If this is an upgrade, track upgrade information
    if (metadata?.isUpgrade === "true") {
      subscriptionData.isUpgrade = true;
      subscriptionData.upgradedFrom = metadata.upgradedFrom || "";
      subscriptionData.previousSubscriptionId = metadata.oldSubscriptionId || "";
      
      if (metadata.remainingDays) {
        subscriptionData.trialDays = parseInt(metadata.remainingDays, 10);
      }
    }

    subscription = await Subscription.create(subscriptionData);

    // If this is an upgrade, cancel the old subscription
    if (metadata?.isUpgrade === "true" && metadata?.oldSubscriptionId) {
      try {
        await stripe.subscriptions.cancel(metadata.oldSubscriptionId);
        console.log(
          "---------------------------> Canceled old subscription:",
          metadata.oldSubscriptionId,
          "<-------------------------"
        );
        
        // Mark old subscription as canceled in DB
        await Subscription.findOneAndUpdate(
          { stripeSubscriptionId: metadata.oldSubscriptionId },
          { status: "canceled" }
        );
      } catch (error) {
        console.error("Failed to cancel old subscription:", error);
      }
    }
  }

  subscription.status = stripeSub.status;

  // Get period dates from the subscription (Stripe stores them there)
  const currentPeriodStart =
    stripeSub.current_period_start ||
    stripeSub.items?.data?.[0]?.current_period_start;
  const currentPeriodEnd =
    stripeSub.current_period_end ||
    stripeSub.items?.data?.[0]?.current_period_end;

  // Handle trial period dates (for upgrades with remaining days)
  const trialStart = stripeSub.trial_start;
  const trialEnd = stripeSub.trial_end;

  // Only update period dates if they exist (they may be undefined for incomplete subscriptions)
  if (currentPeriodStart) {
    subscription.currentPeriodStart = new Date(currentPeriodStart * 1000);
  }

  if (currentPeriodEnd) {
    // Stripe now handles the trial period, so we use the date directly
    // No need to manually add remaining days - Stripe's trial_end already includes them
    subscription.currentPeriodEnd = new Date(currentPeriodEnd * 1000);
  }

  // Track trial period if present (for upgrades)
  if (trialStart) {
    subscription.trialStart = new Date(trialStart * 1000);
  }
  if (trialEnd) {
    subscription.trialEnd = new Date(trialEnd * 1000);
    // For trialing subscriptions, the effective end date should consider trial + paid period
    // Stripe's current_period_end during trial IS the trial_end
    // After trial ends, Stripe will update current_period_end to include the paid period
    console.log(
      `📅 Trial period detected: ${new Date(trialStart * 1000).toISOString()} to ${new Date(trialEnd * 1000).toISOString()}`
    );
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

  // Consider both "active" and "trialing" as valid active states
  const isActive =
    (subscription.status === "active" || subscription.status === "trialing") &&
    subscription.currentPeriodEnd &&
    new Date(subscription.currentPeriodEnd) > new Date();

  // Calculate remaining days
  let remainingDays = 0;
  if (subscription.currentPeriodEnd) {
    remainingDays = Math.max(
      0,
      Math.ceil(
        (new Date(subscription.currentPeriodEnd).getTime() -
          new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
  }

  // If trialing, calculate trial remaining days separately
  let trialRemainingDays = 0;
  if (subscription.status === "trialing" && subscription.trialEnd) {
    trialRemainingDays = Math.max(
      0,
      Math.ceil(
        (new Date(subscription.trialEnd).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
  }

  return {
    hasActiveSubscription: isActive,
    subscription: {
      interval: subscription.interval,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      remainingDays,
      // Include trial info if applicable
      isTrialing: subscription.status === "trialing",
      trialEnd: subscription.trialEnd || null,
      trialRemainingDays: trialRemainingDays > 0 ? trialRemainingDays : undefined,
      // Include upgrade info if applicable
      isUpgrade: subscription.isUpgrade || false,
      upgradedFrom: subscription.upgradedFrom || undefined,
    },
  };
};

const updateSubscriptionStatus = async (
  stripeSubscriptionId: string,
  status: string
) => {
  try {
    const subscription = await Subscription.findOneAndUpdate(
      { stripeSubscriptionId },
      { status },
      { new: true }
    );
    
    if (subscription) {
      console.log(`✅ Updated subscription ${stripeSubscriptionId} status to ${status}`);
    } else {
      console.log(`⚠️ Subscription ${stripeSubscriptionId} not found in database`);
    }
    
    return subscription;
  } catch (error) {
    console.error("❌ Error updating subscription status:", error);
    throw error;
  }
};

export const SubscriptionServices = {
  upsertStripeSubscription,
  getCurrentSubscription,
  updateSubscriptionStatus,
};
