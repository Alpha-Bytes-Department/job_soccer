import { PaymentHistory } from "./paymentHistory.model";
import { User } from "../user/user.model";

const createPaymentHistory = async (paymentData: {
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
}) => {
  try {
    // Find user by stripe customer ID
    const user = await User.findOne({ stripeCustomerId: paymentData.stripeCustomerId });
    
    if (!user) {
      console.error(`User not found for stripeCustomerId: ${paymentData.stripeCustomerId}`);
      return null;
    }

    // Check if payment already exists to avoid duplicates
    const existingPayment = await PaymentHistory.findOne({
      stripePaymentIntentId: paymentData.stripePaymentIntentId,
    });

    if (existingPayment) {
      // Update existing payment
      existingPayment.status = paymentData.status;
      existingPayment.amount = paymentData.amount;
      existingPayment.paidAt = paymentData.paidAt;
      await existingPayment.save();
      return existingPayment;
    }

    // Create new payment history
    const paymentHistory = await PaymentHistory.create({
      user: user._id,
      ...paymentData,
    });

    return paymentHistory;
  } catch (error) {
    console.error("Error creating payment history:", error);
    throw error;
  }
};

export const PaymentHistoryService = {
  createPaymentHistory,
};
