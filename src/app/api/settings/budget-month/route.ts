import { NextResponse } from "next/server";
import { z } from "zod";
import { moveBudgetMonth } from "@/lib/budget";
import { getSession } from "@/lib/session";

const schema = z.object({
  fromYear: z.number().int(),
  fromMonth: z.number().int().min(1).max(12),
  toYear: z.number().int(),
  toMonth: z.number().int().min(1).max(12),
  replaceExisting: z.boolean().optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = schema.parse(await request.json());
    await moveBudgetMonth(
      session.userId,
      body.fromYear,
      body.fromMonth,
      body.toYear,
      body.toMonth,
      { replaceExisting: body.replaceExisting },
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to move budget month";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
