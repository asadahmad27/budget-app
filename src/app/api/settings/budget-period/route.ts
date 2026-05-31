import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getUserBudgetSettings,
  updateBudgetPeriodSettings,
} from "@/lib/budget";
import { MAX_BUDGET_PERIOD_DAY } from "@/lib/budget-period";
import { getSession } from "@/lib/session";

const daySchema = z.number().int().min(1).max(MAX_BUDGET_PERIOD_DAY);

const schema = z.object({
  budgetPeriodStartDay: daySchema,
  budgetPeriodEndDay: daySchema,
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getUserBudgetSettings(session.userId);
  return NextResponse.json(settings);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = schema.parse(await request.json());
    await updateBudgetPeriodSettings(session.userId, {
      startDay: body.budgetPeriodStartDay,
      endDay: body.budgetPeriodEndDay,
    });

    const settings = await getUserBudgetSettings(session.userId);
    return NextResponse.json({
      budgetPeriodStartDay: settings.budgetPeriodStartDay,
      budgetPeriodEndDay: settings.budgetPeriodEndDay,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to update budget period settings";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
