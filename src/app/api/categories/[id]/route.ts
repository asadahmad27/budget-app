import { NextResponse } from "next/server";
import { z } from "zod";
import { updateCategoryBudget } from "@/lib/budget";
import { getSession } from "@/lib/session";

const schema = z
  .object({
    year: z.number().int(),
    month: z.number().int().min(1).max(12),
    budgetAmount: z.number().min(0).optional(),
    complete: z.boolean().optional(),
  })
  .refine(
    (data) => data.budgetAmount !== undefined || data.complete === true,
    { message: "Provide a budget amount or mark the category complete" },
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
    await updateCategoryBudget({
      userId: session.userId,
      categoryId: id,
      ...body,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update category budget";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
