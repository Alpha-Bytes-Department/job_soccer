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
      
      // Try to get metadata from the checkout session if available
      let metadata: any = {};
      try {
        const subscription = event.data.object;
        if (subscription.metadata) {
          metadata = subscription.metadata;
        } else {
          // Try to retrieve from the latest invoice's payment intent
          const latestInvoice = subscription.latest_invoice;
          if (latestInvoice) {
            const invoice: any = typeof latestInvoice === 'string' 
              ? await stripe.invoices.retrieve(latestInvoice)
              : latestInvoice;
            
            if (invoice.payment_intent) {
              const paymentIntent: any = typeof invoice.payment_intent === 'string'
                ? await stripe.paymentIntents.retrieve(invoice.payment_intent)
                : invoice.payment_intent;
              
              if (paymentIntent.metadata) {
                metadata = paymentIntent.metadata;
              }
            }
          }
        }
      } catch (metadataError) {
        console.error("Failed to retrieve metadata:", metadataError);
      }
      
      await SubscriptionServices.upsertStripeSubscription(event.data.object, metadata);
      break;

    case "customer.subscription.deleted":
      // optional: mark canceled in DB
      break;
  }

  res.json({ received: true });
};
