import Stripe from "stripe";
import { absoluteUrl } from "./utils";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error(
        "STRIPE_SECRET_KEY is not set. Add it to .env.local to enable billing."
      );
    }
    _stripe = new Stripe(key, {
      apiVersion: "2024-06-20",
      typescript: true,
    });
  }
  return _stripe;
}

/** @deprecated Use getStripe() for lazy init — kept for backward compat */
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as any)[prop];
  },
});

export async function createCheckoutSession(params: {
  customerId?: string;
  priceId: string;
  userId: string;
  email: string;
}) {
  return getStripe().checkout.sessions.create({
    customer: params.customerId,
    customer_email: params.customerId ? undefined : params.email,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: params.priceId, quantity: 1 }],
    success_url: absoluteUrl("/dashboard?billing=success"),
    cancel_url: absoluteUrl("/pricing"),
    metadata: { userId: params.userId },
    subscription_data: {
      metadata: { userId: params.userId },
      trial_period_days: 7,
    },
  });
}

export async function createBillingPortalSession(customerId: string) {
  return getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: absoluteUrl("/dashboard/billing"),
  });
}

export async function createCreditPackCheckout(params: {
  customerId?: string;
  email: string;
  userId: string;
  priceId: string;
  quantity: number;
}) {
  return getStripe().checkout.sessions.create({
    customer: params.customerId,
    customer_email: params.customerId ? undefined : params.email,
    mode: "payment",
    line_items: [{ price: params.priceId, quantity: params.quantity }],
    success_url: absoluteUrl("/dashboard/billing?credits=success"),
    cancel_url: absoluteUrl("/dashboard/billing"),
    metadata: {
      userId: params.userId,
      type: "credit_pack",
      quantity: params.quantity.toString(),
    },
  });
}
