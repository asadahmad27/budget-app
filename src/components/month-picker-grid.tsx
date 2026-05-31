"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { MonthOverview } from "@/lib/budget";
import {
  isCurrentPeriod,
  isCustomBudgetPeriod,
  type BudgetPeriodConfig,
} from "@/lib/budget-period";
import {
  readDashboardPeriod,
  writeDashboardPeriod,
  type DashboardPeriod,
} from "@/lib/dashboard-period";
import {
  formatAmountCompact,
  formatMonthShort,
  formatPeriodRange,
} from "@/lib/format";

export function MonthPickerGrid({
  year,
  months,
  budgetPeriodStartDay = 1,
  budgetPeriodEndDay = 31,
}: {
  year: number;
  months: MonthOverview[];
  budgetPeriodStartDay?: number;
  budgetPeriodEndDay?: number;
}) {
  const router = useRouter();
  const budgetPeriod: BudgetPeriodConfig = {
    startDay: budgetPeriodStartDay,
    endDay: budgetPeriodEndDay,
  };
  // const showCustomRange = isCustomBudgetPeriod(budgetPeriod);
  const [storedPeriod, setStoredPeriod] = useState<DashboardPeriod | null>(null);

  useEffect(() => {
    setStoredPeriod(readDashboardPeriod());
  }, []);

  function selectMonth(period: DashboardPeriod) {
    writeDashboardPeriod(period);
    router.push(`/dashboard?year=${period.year}&month=${period.month}`);
  }

  return (
    <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-primary">Pick a budget month</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          Choose the month you want to work on. Your selection is remembered.
        </p>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <Link
          href={`/months?year=${year - 1}`}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-container-low"
          aria-label="Previous year"
        >
          <span className="material-symbols-outlined text-primary text-xl">
            chevron_left
          </span>
        </Link>
        <h3 className="text-sm font-semibold text-primary">{year}</h3>
        <Link
          href={`/months?year=${year + 1}`}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-container-low"
          aria-label="Next year"
        >
          <span className="material-symbols-outlined text-primary text-xl">
            chevron_right
          </span>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {months.map((item) => {
          const isStored =
            storedPeriod?.year === item.year &&
            storedPeriod?.month === item.month;
          const isCurrent = isCurrentPeriod(
            item.year,
            item.month,
            budgetPeriod,
          );

          return (
            <button
              key={item.month}
              type="button"
              onClick={() => selectMonth({ year: item.year, month: item.month })}
              className={`rounded-lg border px-2 py-3 text-center transition-colors ${
                isStored
                  ? "border-primary bg-primary text-on-primary"
                  : isCurrent
                    ? "border-secondary bg-secondary-container text-on-secondary-container"
                    : "border-outline-variant/30 bg-surface-container-lowest hover:bg-surface-container-low"
              }`}
            >
              <p className="text-sm font-semibold">{formatMonthShort(item.month)}</p>
              {/* Budget period range hidden for now
              {showCustomRange ? (
                <p
                  className={`mt-0.5 text-[10px] leading-tight ${
                    isStored
                      ? "text-on-primary/70"
                      : "text-on-surface-variant"
                  }`}
                >
                  {formatPeriodRange(item.year, item.month, budgetPeriod)}
                </p>
              ) : null}
              */}
              <p
                className={`mt-1 text-[11px] leading-tight ${
                  isStored ? "text-on-primary/80" : "text-on-surface-variant"
                }`}
              >
                {formatAmountCompact(item.totalSpent)} /{" "}
                {formatAmountCompact(item.totalAllocated)}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
