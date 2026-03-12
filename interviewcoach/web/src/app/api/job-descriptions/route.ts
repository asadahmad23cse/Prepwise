import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateDbUser } from "@/lib/auth";
import { createJobDescriptionSchema } from "@/lib/validations";

export async function GET() {
  const user = await getOrCreateDbUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const jds = await db.jobDescription.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: jds });
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
  const parsed = createJobDescriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  const jd = await db.jobDescription.create({
    data: {
      userId: user.id,
      title: parsed.data.title,
      company: parsed.data.company,
      rawText: parsed.data.rawText,
    },
  });

  return NextResponse.json({ success: true, data: jd }, { status: 201 });
}
