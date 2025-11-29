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
    console.log(`\n📝 Creating payment history for customer: ${paymentData.stripeCustomerId}`);
    
    // Find user by stripe customer ID
    const user = await User.findOne({ stripeCustomerId: paymentData.stripeCustomerId });
    
    if (!user) {
      console.error(`❌ User not found for stripeCustomerId: ${paymentData.stripeCustomerId}`);
      return null;
    }
    
    console.log(`✅ User found: ${user._id} (${user.email})`);

    // Check if payment already exists to avoid duplicates
    const existingPayment = await PaymentHistory.findOne({
      stripePaymentIntentId: paymentData.stripePaymentIntentId,
    });

    if (existingPayment) {
      console.log(`⚠️ Payment already exists, updating: ${existingPayment._id}`);
      // Update existing payment
      existingPayment.status = paymentData.status;
      existingPayment.amount = paymentData.amount;
      existingPayment.paidAt = paymentData.paidAt;
      await existingPayment.save();
      console.log(`✅ Payment history updated successfully`);
      return existingPayment;
    }

    // Create new payment history
    console.log(`Creating new payment history for user: ${user._id}`);
    const paymentHistory = await PaymentHistory.create({
      user: user._id,
      ...paymentData,
    });
    
    console.log(`✅ Payment history created successfully: ${paymentHistory._id}`);
    return paymentHistory;
  } catch (error) {
    console.error("❌ Error creating payment history:", error);
    throw error;
  }
};

export const PaymentHistoryService = {
  createPaymentHistory,
};
