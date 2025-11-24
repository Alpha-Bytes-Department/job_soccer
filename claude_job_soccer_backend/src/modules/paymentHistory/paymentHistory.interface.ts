import { Types } from "mongoose";

export interface IPaymentHistory {
  user: Types.ObjectId;
  stripeCustomerId: string;
  stripePaymentIntentId: string;
  stripeInvoiceId?: string;
  stripeSubscriptionId?: string;
  amount: number;
  currency: string;
  status: "succeeded" | "pending" | "failed" | "canceled" | "refunded";
  paymentMethod?: string;
  description?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
