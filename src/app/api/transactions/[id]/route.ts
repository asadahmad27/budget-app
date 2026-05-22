import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteTransaction, updateTransaction } from "@/lib/budget";
import { getSession } from "@/lib/session";

const updateSchema = z.object({
  walletId: z.string().min(1),
  categoryId: z.string().optional(),
  amount: z.number().positive(),
  description: z.string().optional(),
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
    await updateTransaction(session.userId, id, body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update transaction";
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
    await deleteTransaction(session.userId, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete transaction";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
