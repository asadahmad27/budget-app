"use client";

import Link from "next/link";
import type { MonthOverview } from "@/lib/budget";
import {
  isCurrentPeriod,
  isCustomBudgetPeriod,
  type BudgetPeriodConfig,
} from "@/lib/budget-period";
import { writeDashboardPeriod } from "@/lib/dashboard-period";
import {
  formatAmountCompact,
  formatMonthShort,
  formatPeriodRange,
} from "@/lib/format";

export function DashboardMonthCalendar({
  year,
  selectedMonth,
  months,
  budgetPeriodStartDay = 1,
  budgetPeriodEndDay = 31,
}: {
  year: number;
  selectedMonth: number;
  months: MonthOverview[];
  budgetPeriodStartDay?: number;
  budgetPeriodEndDay?: number;
}) {
  const budgetPeriod: BudgetPeriodConfig = {
    startDay: budgetPeriodStartDay,
    endDay: budgetPeriodEndDay,
  };
  const showCustomRange = isCustomBudgetPeriod(budgetPeriod);

  function selectMonth(period: { year: number; month: number }) {
    writeDashboardPeriod(period);
  }

  return (
    <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4">
      <div className="mb-3 flex items-center justify-between">
        <Link
          href={`/dashboard?year=${year - 1}&month=${selectedMonth}`}
          onClick={() => selectMonth({ year: year - 1, month: selectedMonth })}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-container-low"
          aria-label="Previous year"
        >
          <span className="material-symbols-outlined text-primary text-xl">
            chevron_left
          </span>
        </Link>
        <h3 className="text-sm font-semibold text-primary">{year}</h3>
        <Link
          href={`/dashboard?year=${year + 1}&month=${selectedMonth}`}
          onClick={() => selectMonth({ year: year + 1, month: selectedMonth })}
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
          const isSelected = item.month === selectedMonth;
          const isCurrent = isCurrentPeriod(
            item.year,
            item.month,
            budgetPeriod,
          );

          return (
            <Link
              key={item.month}
              href={`/dashboard?year=${item.year}&month=${item.month}`}
              onClick={() => selectMonth({ year: item.year, month: item.month })}
              className={`rounded-lg border px-2 py-3 text-center transition-colors ${
                isSelected
                  ? "border-primary bg-primary text-on-primary"
                  : isCurrent
                    ? "border-secondary bg-secondary-container text-on-secondary-container"
                    : "border-outline-variant/30 bg-surface-container-lowest hover:bg-surface-container-low"
              }`}
            >
              <p className="text-sm font-semibold">{formatMonthShort(item.month)}</p>
              {showCustomRange ? (
                <p
                  className={`mt-0.5 text-[10px] leading-tight ${
                    isSelected
                      ? "text-on-primary/70"
                      : "text-on-surface-variant"
                  }`}
                >
                  {formatPeriodRange(item.year, item.month, budgetPeriod)}
                </p>
              ) : null}
              <p
                className={`mt-1 text-[11px] leading-tight ${
                  isSelected
                    ? "text-on-primary/80"
                    : "text-on-surface-variant"
                }`}
              >
                {formatAmountCompact(item.totalSpent)} /{" "}
                {formatAmountCompact(item.totalAllocated)}
              </p>
            </Link>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-on-surface-variant">
        Spent / allocated per budget period. Your selection is remembered on this
        page.
      </p>
    </section>
  );
}
