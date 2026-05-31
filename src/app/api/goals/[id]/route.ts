import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteLifeGoal, updateLifeGoal } from "@/lib/goals";
import { getSession } from "@/lib/session";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  note: z.string().optional(),
  projectedCost: z.number().positive().optional(),
  savedAmount: z.number().min(0).optional(),
  walletId: z.string().min(1).nullable().optional(),
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
    const goal = await updateLifeGoal(session.userId, id, body);
    return NextResponse.json({ ok: true, goal });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update goal";
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
    await deleteLifeGoal(session.userId, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete goal";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
