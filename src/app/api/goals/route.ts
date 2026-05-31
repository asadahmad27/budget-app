import { NextResponse } from "next/server";
import { z } from "zod";
import { createLifeGoal, getLifeGoals } from "@/lib/goals";
import { getSession } from "@/lib/session";

const createSchema = z.object({
  name: z.string().min(1),
  note: z.string().optional(),
  projectedCost: z.number().positive(),
  savedAmount: z.number().min(0).optional(),
  walletId: z.string().min(1).nullable().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await getLifeGoals(session.userId);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = createSchema.parse(await request.json());
    const goal = await createLifeGoal({
      userId: session.userId,
      name: body.name,
      note: body.note,
      projectedCost: body.projectedCost,
      savedAmount: body.savedAmount,
      walletId: body.walletId ?? null,
    });
    return NextResponse.json({ ok: true, goal });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create goal";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
