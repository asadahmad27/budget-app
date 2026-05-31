"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getCurrentPeriod,
  type BudgetPeriodConfig,
} from "@/lib/budget-period";
import {
  readDashboardPeriod,
  writeDashboardPeriod,
} from "@/lib/dashboard-period";

export function DashboardPeriodSync({
  budgetPeriodStartDay = 1,
  budgetPeriodEndDay = 31,
}: {
  budgetPeriodStartDay?: number;
  budgetPeriodEndDay?: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const yearParam = searchParams.get("year");
  const monthParam = searchParams.get("month");
  const budgetPeriod: BudgetPeriodConfig = {
    startDay: budgetPeriodStartDay,
    endDay: budgetPeriodEndDay,
  };

  useEffect(() => {
    const year = Number(yearParam);
    const month = Number(monthParam);
    const hasValidParams =
      yearParam &&
      monthParam &&
      Number.isInteger(year) &&
      Number.isInteger(month) &&
      month >= 1 &&
      month <= 12;

    if (hasValidParams) {
      writeDashboardPeriod({ year, month });
      return;
    }

    const stored =
      readDashboardPeriod() ?? getCurrentPeriod(budgetPeriod);
    writeDashboardPeriod(stored);
    router.replace(`/dashboard?year=${stored.year}&month=${stored.month}`);
  }, [yearParam, monthParam, router, budgetPeriodStartDay, budgetPeriodEndDay]);

  return null;
}
