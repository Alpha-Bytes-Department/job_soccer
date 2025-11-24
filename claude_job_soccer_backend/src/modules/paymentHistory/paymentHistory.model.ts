import { Schema, model, Types } from "mongoose";
import { IPaymentHistory } from "./paymentHistory.interface";

const PaymentHistorySchema = new Schema<IPaymentHistory>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    stripeCustomerId: { type: String, required: true },
    stripePaymentIntentId: { type: String, required: true, unique: true },
    stripeInvoiceId: { type: String },
    stripeSubscriptionId: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: "usd" },
    status: {
      type: String,
      enum: ["succeeded", "pending", "failed", "canceled", "refunded"],
      required: true,
    },
    paymentMethod: { type: String },
    description: { type: String },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes for efficient queries
PaymentHistorySchema.index({ user: 1, createdAt: -1 });
PaymentHistorySchema.index({ stripeCustomerId: 1 });
PaymentHistorySchema.index({ status: 1 });
PaymentHistorySchema.index({ paidAt: 1 });
PaymentHistorySchema.index({ stripePaymentIntentId: 1 });

export const PaymentHistory = model<IPaymentHistory>("PaymentHistory", PaymentHistorySchema);
