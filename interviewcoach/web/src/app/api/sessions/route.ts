import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateDbUser } from "@/lib/auth";
import { createSessionSchema } from "@/lib/validations";

export async function GET() {
  const user = await getOrCreateDbUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const sessions = await db.interviewSession.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      feedback: {
        select: {
          overallScore: true,
          clarityScore: true,
          confidenceScore: true,
        },
      },
    },
    take: 50,
  });

  return NextResponse.json({ success: true, data: sessions });
}

export async function POST(req: Request) {
  const user = await getOrCreateDbUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const body = await req.json();
  const parsed = createSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  if (user.creditBalance < 1) {
    return NextResponse.json(
      { success: false, error: { code: "INSUFFICIENT_CREDITS", message: "You need at least 1 credit to start a session." } },
      { status: 403 }
    );
  }

  const session = await db.interviewSession.create({
    data: {
      userId: user.id,
      interviewType: parsed.data.interviewType,
      targetRole: parsed.data.targetRole,
      targetCompany: parsed.data.targetCompany,
      jobDescriptionId: parsed.data.jobDescriptionId,
      templateId: parsed.data.templateId,
      status: "SETUP",
    },
  });

  await db.user.update({
    where: { id: user.id },
    data: { creditBalance: { decrement: 1 } },
  });

  await db.creditLedger.create({
    data: {
      userId: user.id,
      action: "DEDUCT",
      amount: -1,
      balance: user.creditBalance - 1,
      description: "Mock interview session started",
      referenceId: session.id,
    },
  });

  return NextResponse.json({ success: true, data: session }, { status: 201 });
}
