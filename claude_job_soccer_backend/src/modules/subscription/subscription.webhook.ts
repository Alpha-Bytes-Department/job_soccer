import { stripe } from "../../config/stripe.config";
import { SubscriptionServices } from "./subscription.service";

export const stripeWebhook = async (req: any, res: any) => {
  const sig = req.headers["stripe-signature"];
  console.log(`
    amar kaceo aycilo
    ${sig}
    
    `);
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    console.log(`
      
      
      ${event.type}


      `);
  } catch (err: any) {
    console.log(`
      
      ⚠️  Webhook signature verification failed. 
      
      `, err.message);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }
  console.log(event.type);
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      console.log(`
        
        
      before upsert stripe subscription
        
         ${event.data.object}
        
        `);

      await SubscriptionServices.upsertStripeSubscription(event.data.object);
      break;

    case "customer.subscription.deleted":
      // optional: mark canceled in DB
      break;
  }

  res.json({ received: true });
};
