import { NextResponse } from "next/server";
import { z } from "zod";
import { deactivateWallet, reactivateWallet } from "@/lib/budget";
import { getSession } from "@/lib/session";

const schema = z.object({
  action: z.enum(["deactivate", "reactivate"]),
  year: z.number().int().optional(),
  month: z.number().int().min(1).max(12).optional(),
});

export async function PATCH(
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

    if (body.action === "deactivate") {
      if (body.year === undefined || body.month === undefined) {
        return NextResponse.json(
          { error: "year and month are required to hide a wallet" },
          { status: 400 },
        );
      }

      await deactivateWallet(session.userId, id, body.year, body.month);
    } else {
      await reactivateWallet(session.userId, id);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update wallet";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
