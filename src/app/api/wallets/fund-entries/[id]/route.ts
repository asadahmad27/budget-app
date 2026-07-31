import { NextResponse } from "next/server";
import { z } from "zod";
import {
  deleteWalletFundEntry,
  updateWalletFundEntry,
} from "@/lib/budget";
import { getSession } from "@/lib/session";

const updateSchema = z.object({
  amount: z.number().positive().optional(),
  note: z.string().optional(),
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
    const body = updateSchema.parse(await request.json());
    const entry = await updateWalletFundEntry(session.userId, id, body);
    return NextResponse.json({ ok: true, entry });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update fund entry";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    await deleteWalletFundEntry(session.userId, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete fund entry";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
