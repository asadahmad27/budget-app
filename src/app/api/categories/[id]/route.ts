import { NextResponse } from "next/server";
import { z } from "zod";
import {
  carryForwardCategoryLeftover,
  discardCategoryLeftover,
  removeCarriedCategoryLeftover,
  updateCategoryBudget,
} from "@/lib/budget";
import { getSession } from "@/lib/session";

const schema = z
  .object({
    year: z.number().int(),
    month: z.number().int().min(1).max(12),
    budgetAmount: z.number().min(0).optional(),
    complete: z.boolean().optional(),
    excluded: z.boolean().optional(),
    carryForwardLeftover: z.boolean().optional(),
    carryAmount: z.number().positive().optional(),
    removeCarriedLeftover: z.boolean().optional(),
    discardLeftover: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.budgetAmount !== undefined ||
      data.complete === true ||
      data.excluded !== undefined ||
      data.carryForwardLeftover === true ||
      data.removeCarriedLeftover === true ||
      data.discardLeftover === true,
    {
      message:
        "Provide a budget amount, mark complete, change visibility, carry leftover, remove leftover, or discard leftover",
    },
  );

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

    if (body.removeCarriedLeftover) {
      await removeCarriedCategoryLeftover({
        userId: session.userId,
        categoryId: id,
        year: body.year,
        month: body.month,
      });
      return NextResponse.json({ ok: true });
    }

    if (body.discardLeftover) {
      await discardCategoryLeftover({
        userId: session.userId,
        categoryId: id,
        year: body.year,
        month: body.month,
      });
      return NextResponse.json({ ok: true });
    }

    if (body.carryForwardLeftover) {
      await carryForwardCategoryLeftover({
        userId: session.userId,
        categoryId: id,
        year: body.year,
        month: body.month,
        amount: body.carryAmount,
      });
      return NextResponse.json({ ok: true });
    }

    await updateCategoryBudget({
      userId: session.userId,
      categoryId: id,
      year: body.year,
      month: body.month,
      budgetAmount: body.budgetAmount,
      complete: body.complete,
      excluded: body.excluded,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update category budget";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
