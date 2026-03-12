import { NextResponse } from "next/server";
import { getOrCreateDbUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { onboardingSchema } from "@/lib/validations";

export async function POST(req: Request) {
  const user = await getOrCreateDbUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const body = await req.json();
  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input" } },
      { status: 400 }
    );
  }

  const updated = await db.user.update({
    where: { id: user.id },
    data: {
      targetRole: parsed.data.targetRole,
      interviewType: parsed.data.interviewType as any,
      experienceLevel: parsed.data.experienceLevel as any,
      onboardingDone: true,
    },
  });

  return NextResponse.json({ success: true, data: updated });
}
