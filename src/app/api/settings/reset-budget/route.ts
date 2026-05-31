import { NextResponse } from "next/server";
import { z } from "zod";
import { resetBudgetMonthToZero } from "@/lib/budget";
import { getSession } from "@/lib/session";

const schema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = schema.parse(await request.json());
    await resetBudgetMonthToZero(session.userId, body.year, body.month);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to reset budget month";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
