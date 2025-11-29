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
    return res.status(400).send(`Webhook error: ${err.message}`);
  }
  
  console.log(`\n🔔 Webhook received: ${event.type}`);
  console.log(`Event ID: ${event.id}`);
  
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      console.log(
        `Processing ${event.type} event for subscription: ${event.data.object.id}`
      );

      // Try to get metadata from the checkout session if available
      let metadata: any = {};
      let invoiceForPayment: any = null;
      
      try {
        const subscription = event.data.object;
        if (subscription.metadata) {
          metadata = subscription.metadata;
        } else {
          // Try to retrieve from the latest invoice's payment intent
          const latestInvoice = subscription.latest_invoice;
          if (latestInvoice) {
            const invoice: any =
              typeof latestInvoice === "string"
                ? await stripe.invoices.retrieve(latestInvoice)
                : latestInvoice;
            
            invoiceForPayment = invoice; // Store for payment history creation

            if (invoice.payment_intent) {
              const paymentIntent: any =
                typeof invoice.payment_intent === "string"
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

      await SubscriptionServices.upsertStripeSubscription(
        event.data.object,
        metadata
      );
      
      // For subscription.created, also create payment history if invoice is paid
      if (event.type === "customer.subscription.created" && invoiceForPayment) {
        console.log(`\n💰 Creating payment history from subscription.created event`);
        try {
          if (invoiceForPayment.status === "paid" && invoiceForPayment.amount_paid > 0) {
            let paymentIntentId = invoiceForPayment.payment_intent;
            let paymentMethod = null;

            if (paymentIntentId && typeof paymentIntentId === "string") {
              try {
                const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
                paymentMethod = paymentIntent.payment_method_types?.[0] || "card";
              } catch (error) {
                console.error("Failed to retrieve payment intent:", error);
              }
            }
            
            const paymentData = {
              stripeCustomerId: invoiceForPayment.customer,
              stripePaymentIntentId: paymentIntentId || invoiceForPayment.id,
              stripeInvoiceId: invoiceForPayment.id,
              stripeSubscriptionId: invoiceForPayment.subscription,
              amount: invoiceForPayment.amount_paid / 100,
              currency: invoiceForPayment.currency,
              status: "succeeded" as const,
              paymentMethod: paymentMethod || undefined,
              description: invoiceForPayment.description || "Initial subscription payment",
              paidAt: new Date(
                invoiceForPayment.status_transitions?.paid_at * 1000 || Date.now()
              ),
            };
            
            console.log("Creating payment history from subscription webhook:", paymentData);
            const paymentHistory = await PaymentHistoryService.createPaymentHistory(paymentData);
            
            if (paymentHistory) {
              console.log(`✅ Payment history created from subscription webhook: ${paymentHistory._id}`);
            }
          } else {
            console.log(`⚠️ Invoice not paid yet or amount is 0, will wait for invoice.paid event`);
          }
        } catch (error) {
          console.error("❌ Failed to create payment history from subscription webhook:", error);
        }
      }
      break;

    case "customer.subscription.deleted":
      // TODO: mark canceled in DB
      break;

    case "invoice.paid":
      console.log(`\n💰 Processing invoice.paid event`);
      try {
        const invoice: any = event.data.object;
        console.log(`Invoice ID: ${invoice.id}`);
        console.log(`Customer ID: ${invoice.customer}`);
        console.log(`Subscription ID: ${invoice.subscription}`);
        console.log(`Amount paid: ${invoice.amount_paid / 100} ${invoice.currency}`);

        // Get payment intent details
        let paymentIntentId = invoice.payment_intent;
        let paymentMethod = null;

        if (paymentIntentId && typeof paymentIntentId === "string") {
          try {
            const paymentIntent = await stripe.paymentIntents.retrieve(
              paymentIntentId
            );
            paymentMethod = paymentIntent.payment_method_types?.[0] || "card";
          } catch (error) {
            console.error("Failed to retrieve payment intent:", error);
          }
        }
        
        const paymentData = {
          stripeCustomerId: invoice.customer,
          stripePaymentIntentId: paymentIntentId || invoice.id,
          stripeInvoiceId: invoice.id,
          stripeSubscriptionId: invoice.subscription,
          amount: invoice.amount_paid / 100, // Convert from cents to dollars
          currency: invoice.currency,
          status: "succeeded" as const,
          paymentMethod: paymentMethod || undefined,
          description: invoice.description || "Subscription payment",
          paidAt: new Date(
            invoice.status_transitions?.paid_at * 1000 || Date.now()
          ),
        };
        
        console.log("Creating payment history with data:", paymentData);
        const paymentHistory = await PaymentHistoryService.createPaymentHistory(paymentData);
        
        if (paymentHistory) {
          console.log(`✅ Payment history created successfully: ${paymentHistory._id}`);
        } else {
          console.log(`⚠️ Payment history creation returned null`);
        }
      } catch (error) {
        console.error("❌ Failed to create payment history:", error);
      }
      break;

    case "invoice.payment_failed":
      console.log(`Processing invoice.payment_failed event`);
      try {
        const invoice: any = event.data.object;
        console.log({
          stripeCustomerId: invoice.customer,
          stripePaymentIntentId: invoice.payment_intent || invoice.id,
          stripeInvoiceId: invoice.id,
          stripeSubscriptionId: invoice.subscription,
          amount: invoice.amount_due / 100,
          currency: invoice.currency,
          status: "failed",
          description: invoice.description || "Failed subscription payment",
        });
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
        console.error(
          "Failed to create payment history for failed payment:",
          error
        );
      }
      break;

    case "checkout.session.completed":
      console.log(`\n✅ Processing checkout.session.completed event`);
      try {
        const session: any = event.data.object;
        console.log(`Session ID: ${session.id}`);
        console.log(`Subscription ID: ${session.subscription}`);
        console.log(`Metadata:`, session.metadata);

        // If this is an upgrade, update the subscription metadata
        if (session.metadata?.isUpgrade === "true" && session.metadata?.oldSubscriptionId) {
          try {
            // Update the new subscription with metadata including remaining days
            if (session.subscription) {
              await stripe.subscriptions.update(session.subscription, {
                metadata: {
                  isUpgrade: "true",
                  oldSubscriptionId: session.metadata.oldSubscriptionId,
                  userId: session.metadata.userId,
                  remainingDays: session.metadata.remainingDays || "0",
                  upgradedFrom: session.metadata.upgradedFrom || "",
                },
              });
              console.log(`✅ Updated subscription metadata for upgrade`);
              console.log(`📅 Remaining days from previous subscription: ${session.metadata.remainingDays || 0}`);

              // Cancel the old subscription immediately
              await stripe.subscriptions.cancel(session.metadata.oldSubscriptionId);
              console.log(`✅ Canceled old subscription: ${session.metadata.oldSubscriptionId}`);

              // Update old subscription status in database
              await SubscriptionServices.updateSubscriptionStatus(
                session.metadata.oldSubscriptionId,
                "canceled"
              );
              console.log(`✅ Updated old subscription status in database`);
            }
          } catch (error) {
            console.error("❌ Failed to handle upgrade:", error);
          }
        }
      } catch (error) {
        console.error("❌ Failed to process checkout.session.completed:", error);
      }
      break;
  }



  res.json({ received: true });
};
