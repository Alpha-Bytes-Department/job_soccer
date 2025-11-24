import { Request, Response } from "express";
import catchAsync from "../../shared/util/catchAsync";
import { STRIPE_PRICES } from "./subscription.constant";
import { createCheckoutSession, SubscriptionServices } from "./subscription.service";

const checkout = catchAsync(async (req: Request, res: Response) => {
  const { interval } = req.body;
  const priceId = (STRIPE_PRICES as any)[interval];

  if (!priceId) return res.status(400).json({ error: "Invalid interval" });
console.log("--------------------------->",{userId:req.user.id,priceId});
console.log("---------------------------> amar kace aycilo");
  const url = await createCheckoutSession(req.user.id, priceId);
  res.status(200).json({ url });
});

const getCurrentSubscription = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user.id;
    const result = await SubscriptionServices.getCurrentSubscription(userId);
    res.status(200).json({
      success: true,
      message: "Current subscription retrieved successfully",
      data: result,
    });
  }
);

export const SubscriptionController = {
  checkout,
  getCurrentSubscription,
};