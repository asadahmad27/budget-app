import { NextResponse } from "next/server";
import { z } from "zod";
import { applyCopyLastMonthBudget } from "@/lib/budget";
import { getSession } from "@/lib/session";

const schema = z.object({
  walletId: z.string().min(1),
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  hideMissing: z.boolean().optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = schema.parse(await request.json());
    await applyCopyLastMonthBudget({
      userId: session.userId,
      ...body,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to copy last month";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
