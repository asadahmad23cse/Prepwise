import { headers } from "next/headers";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.text();
  const headerPayload = await headers();
  const signature = headerPayload.get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;

      if (!userId) break;

      if (session.mode === "subscription") {
        const subscription = await getStripe().subscriptions.retrieve(
          session.subscription as string
        );

        const plan = await db.plan.findFirst({
          where: {
            OR: [
              { stripePriceIdMonthly: subscription.items.data[0]?.price.id },
              { stripePriceIdAnnual: subscription.items.data[0]?.price.id },
            ],
          },
        });

        if (plan) {
          await db.subscription.create({
            data: {
              userId,
              planId: plan.id,
              stripeSubscriptionId: subscription.id,
              stripeCustomerId: subscription.customer as string,
              status: "ACTIVE",
              currentPeriodStart: new Date(
                subscription.current_period_start * 1000
              ),
              currentPeriodEnd: new Date(
                subscription.current_period_end * 1000
              ),
            },
          });

          if (plan.creditsIncluded > 0) {
            await db.user.update({
              where: { id: userId },
              data: {
                creditBalance: { increment: plan.creditsIncluded },
              },
            });

            await db.creditLedger.create({
              data: {
                userId,
                action: "GRANT",
                amount: plan.creditsIncluded,
                balance: plan.creditsIncluded,
                description: `${plan.name} plan subscription credits`,
              },
            });
          }
        }
      }

      if (session.metadata?.type === "credit_pack") {
        const quantity = parseInt(session.metadata.quantity ?? "0", 10);
        if (quantity > 0) {
          await db.user.update({
            where: { id: userId },
            data: { creditBalance: { increment: quantity } },
          });

          await db.creditLedger.create({
            data: {
              userId,
              action: "PURCHASE",
              amount: quantity,
              balance: quantity,
              description: `Purchased ${quantity} credit pack`,
            },
          });
        }
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const existing = await db.subscription.findUnique({
        where: { stripeSubscriptionId: subscription.id },
      });

      if (existing) {
        const statusMap: Record<string, string> = {
          active: "ACTIVE",
          past_due: "PAST_DUE",
          canceled: "CANCELLED",
          trialing: "TRIALING",
        };

        await db.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: (statusMap[subscription.status] ?? "ACTIVE") as any,
            currentPeriodStart: new Date(
              subscription.current_period_start * 1000
            ),
            currentPeriodEnd: new Date(
              subscription.current_period_end * 1000
            ),
            cancelledAt: subscription.canceled_at
              ? new Date(subscription.canceled_at * 1000)
              : null,
          },
        });
      }
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscription = invoice.subscription
        ? await db.subscription.findUnique({
            where: { stripeSubscriptionId: invoice.subscription as string },
          })
        : null;

      if (subscription) {
        await db.invoice.create({
          data: {
            userId: subscription.userId,
            stripeInvoiceId: invoice.id,
            amountCents: invoice.amount_paid,
            currency: invoice.currency,
            status: "paid",
            pdfUrl: invoice.invoice_pdf,
          },
        });
      }
      break;
    }
  }

  return new Response("OK", { status: 200 });
}
