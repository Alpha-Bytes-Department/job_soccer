import { stripe } from "../../config/stripe.config";
import { SubscriptionServices } from "./subscription.service";
import { PaymentHistoryService } from "../paymentHistory/paymentHistory.service";

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

    case "invoice.paid":
      console.log(`Processing invoice.paid event`);
      try {
        const invoice: any = event.data.object;
        
        // Get payment intent details
        let paymentIntentId = invoice.payment_intent;
        let paymentMethod = null;
        
        if (paymentIntentId && typeof paymentIntentId === "string") {
          try {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            paymentMethod = paymentIntent.payment_method_types?.[0] || "card";
          } catch (error) {
            console.error("Failed to retrieve payment intent:", error);
          }
        }

        await PaymentHistoryService.createPaymentHistory({
          stripeCustomerId: invoice.customer,
          stripePaymentIntentId: paymentIntentId || invoice.id,
          stripeInvoiceId: invoice.id,
          stripeSubscriptionId: invoice.subscription,
          amount: invoice.amount_paid / 100, // Convert from cents to dollars
          currency: invoice.currency,
          status: "succeeded",
          paymentMethod: paymentMethod || undefined,
          description: invoice.description || "Subscription payment",
          paidAt: new Date(invoice.status_transitions?.paid_at * 1000 || Date.now()),
        });
      } catch (error) {
        console.error("Failed to create payment history:", error);
      }
      break;

    case "invoice.payment_failed":
      console.log(`Processing invoice.payment_failed event`);
      try {
        const invoice: any = event.data.object;
        
        await PaymentHistoryService.createPaymentHistory({
          stripeCustomerId: invoice.customer,
          stripePaymentIntentId: invoice.payment_intent || invoice.id,
          stripeInvoiceId: invoice.id,
          stripeSubscriptionId: invoice.subscription,
          amount: invoice.amount_due / 100,
          currency: invoice.currency,
          status: "failed",
          description: invoice.description || "Failed subscription payment",
        });
      } catch (error) {
        console.error("Failed to create payment history for failed payment:", error);
      }
      break;
  }

  res.json({ received: true });
};
