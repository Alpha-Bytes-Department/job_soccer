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

const upsertStripeSubscription = async (stripeSub: any) => {
  console.log("---------------------------> Inside upsertStripeSubscription  1st Line<------------------------- ");
  const customerId = stripeSub.customer;

  const user = await User.findOne({ stripeCustomerId: customerId });
  if (!user) return;

  let subscription = await Subscription.findOne({
    stripeSubscriptionId: stripeSub.id,
  });
  console.log(
    "---------------------------> Inside upsertStripeSubscription  Subscription ID: ",
    
    subscription?._id,
    "<-------------------------"
  );
  console.log("--------------------------->Hello<-------------------------");
  if (!subscription) {
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
  }

  subscription.status = stripeSub.status;
  subscription.currentPeriodStart = new Date(
    stripeSub.current_period_start * 1000
  );
  subscription.currentPeriodEnd = new Date(stripeSub.current_period_end * 1000);

  await subscription.save();

  user.activeSubscriptionId = subscription._id;

  await user.save();
};

export const SubscriptionServices = {
  upsertStripeSubscription,
};
