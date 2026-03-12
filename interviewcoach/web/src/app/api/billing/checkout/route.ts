import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createCheckoutSession } from "@/lib/stripe";
import { z } from "zod";

const inputSchema = z.object({
  priceId: z.string(),
});

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const user = await db.user.findUnique({
    where: { clerkId },
    include: {
      subscriptions: {
        where: { status: { in: ["ACTIVE", "TRIALING"] } },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
      { status: 404 }
    );
  }

  const body = await req.json();
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input" } },
      { status: 400 }
    );
  }

  const existingCustomerId = user.subscriptions[0]?.stripeCustomerId ?? undefined;

  const session = await createCheckoutSession({
    customerId: existingCustomerId,
    priceId: parsed.data.priceId,
    userId: user.id,
    email: user.email,
  });

  return NextResponse.json({ success: true, data: { url: session.url } });
}
