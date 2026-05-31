import { NextResponse } from "next/server";
import { z } from "zod";
import { moveTransactionToMonth } from "@/lib/budget";
import { getSession } from "@/lib/session";

const schema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = schema.parse(await request.json());
    await moveTransactionToMonth(session.userId, id, body.year, body.month);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to move transaction";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
