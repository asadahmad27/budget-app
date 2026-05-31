"use client";

import { useState } from "react";
import { formatMoney, formatPeriodLabel } from "@/lib/format";

type View = "allocated" | "unspent" | "lastMonth";

export function CategoryTotalsSummary({
  totalBudget,
  totalUnspent,
  totalSpent,
  categoryCount,
  lastMonthUnspent,
  lastMonthBudget,
  lastMonthSpent,
  lastMonthYear,
  lastMonthMonth,
  lastMonthLabel,
}: {
  totalBudget: number;
  totalUnspent: number;
  totalSpent: number;
  categoryCount: number;
  lastMonthUnspent: number;
  lastMonthBudget: number;
  lastMonthSpent: number;
  lastMonthYear: number;
  lastMonthMonth: number;
  lastMonthLabel?: string;
}) {
  const [view, setView] = useState<View>("allocated");
  const resolvedLastMonthLabel =
    lastMonthLabel ??
    formatPeriodLabel(lastMonthYear, lastMonthMonth, {
      startDay: 1,
      endDay: 31,
    });

  const label =
    view === "allocated"
      ? "Total allocated"
      : view === "unspent"
        ? "Total unspent"
        : `Unspent from ${resolvedLastMonthLabel}`;

  const amount =
    view === "allocated"
      ? totalBudget
      : view === "unspent"
        ? totalUnspent
        : lastMonthUnspent;

  const detail =
    view === "allocated"
      ? `${formatMoney(totalSpent)} spent across ${categoryCount} ${categoryCount === 1 ? "category" : "categories"}`
      : view === "unspent"
        ? `${formatMoney(totalSpent)} spent · ${formatMoney(totalBudget)} allocated this month`
        : lastMonthBudget > 0
          ? `${formatMoney(lastMonthSpent)} spent · ${formatMoney(lastMonthBudget)} allocated in ${lastMonthLabel}`
          : `No category budgets recorded for ${lastMonthLabel}`;

  return (
    <div className="rounded-xl bg-surface-container-low p-4">
      <div className="mb-3 flex overflow-x-auto rounded-lg bg-surface-container-lowest p-1 no-scrollbar">
        <button
          type="button"
          onClick={() => setView("allocated")}
          className={`flex-1 whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium transition-colors ${
            view === "allocated"
              ? "bg-primary text-on-primary"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          Total allocated
        </button>
        <button
          type="button"
          onClick={() => setView("unspent")}
          className={`flex-1 whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium transition-colors ${
            view === "unspent"
              ? "bg-primary text-on-primary"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          Total unspent
        </button>
        <button
          type="button"
          onClick={() => setView("lastMonth")}
          className={`flex-1 whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium transition-colors ${
            view === "lastMonth"
              ? "bg-primary text-on-primary"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          Last month
        </button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-on-surface-variant">{label}</p>
        <p className="text-lg font-semibold text-primary">{formatMoney(amount)}</p>
      </div>
      <p className="mt-1 text-xs text-on-surface-variant">{detail}</p>
    </div>
  );
}
