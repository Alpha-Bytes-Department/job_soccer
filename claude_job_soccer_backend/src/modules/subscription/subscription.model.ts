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
  },
  { timestamps: true }
);

export const Subscription = model("Subscription", SubscriptionSchema);