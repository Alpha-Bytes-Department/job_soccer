import Stripe from "stripe";
import config from ".";

export const stripe = new Stripe(config.stripe.stripe_secret_key!, {
  apiVersion: "2025-11-17.clover",
});