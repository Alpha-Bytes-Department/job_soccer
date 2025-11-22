import { stripe } from "../../config/stripe.config";
import { SubscriptionServices } from "./subscription.service";

export const stripeWebhook = async (req: any, res: any) => {
  const sig = req.headers["stripe-signature"];
 
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

  } catch (err: any) {
    console.log(`
      
      ⚠️  Webhook signature verification failed. 
      
      `, err.message);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      console.log(`Processing ${event.type} event for subscription: ${event.data.object.id}`);
      await SubscriptionServices.upsertStripeSubscription(event.data.object);
      break;

    case "customer.subscription.deleted":
      // optional: mark canceled in DB
      break;
  }

  res.json({ received: true });
};
