import { NextResponse } from "next/server";
import { z } from "zod";
import { createCategory } from "@/lib/budget";
import { getSession } from "@/lib/session";

const schema = z.object({
  walletId: z.string().min(1),
  name: z.string().min(1),
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  budgetAmount: z.number().min(0).optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = schema.parse(await request.json());
    const category = await createCategory({
      userId: session.userId,
      ...body,
    });

    return NextResponse.json({
      category: {
        id: category.id,
        name: category.name,
        walletId: category.walletId,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create category";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
