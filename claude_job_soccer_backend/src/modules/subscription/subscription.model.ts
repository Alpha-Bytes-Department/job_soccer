import { Schema, model, Types } from "mongoose";

const SubscriptionSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true },

    stripeSubscriptionId: { type: String, required: true },
    stripePriceId: { type: String, required: true },

    interval: {
      type: String,
      enum: ["monthly", "halfYearly", "yearly"],
      required: true,
    },
    
    intervalCount: { type: Number },

    status: {
      type: String,
      enum: [
        "active",
        "incomplete",
        "past_due",
        "canceled",
        "unpaid",
        "trialing",
      ],
      default: "incomplete",
    },

    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    
    // Trial period tracking for upgrades
    trialStart: Date,
    trialEnd: Date,
    trialDays: { type: Number, default: 0 }, // Remaining days from previous subscription
    
    // Upgrade tracking
    isUpgrade: { type: Boolean, default: false },
    upgradedFrom: { type: String }, // Previous subscription interval (monthly, halfYearly, yearly)
    previousSubscriptionId: { type: String }, // Previous Stripe subscription ID
  },
  { timestamps: true }
);

export const Subscription = model("Subscription", SubscriptionSchema);