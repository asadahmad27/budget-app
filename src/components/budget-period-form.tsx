"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  formatPeriodRange,
  isCalendarBudgetPeriod,
  MAX_BUDGET_PERIOD_DAY,
  type BudgetPeriodConfig,
} from "@/lib/budget-period";

function dayLabel(day: number) {
  return String(day);
}

export function BudgetPeriodForm({
  budgetPeriodStartDay,
  budgetPeriodEndDay,
  previewYear,
  previewMonth,
}: {
  budgetPeriodStartDay: number;
  budgetPeriodEndDay: number;
  previewYear: number;
  previewMonth: number;
}) {
  const router = useRouter();
  const [startDay, setStartDay] = useState(budgetPeriodStartDay);
  const [endDay, setEndDay] = useState(budgetPeriodEndDay);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const previewConfig = useMemo<BudgetPeriodConfig>(
    () => ({ startDay, endDay }),
    [startDay, endDay],
  );

  const preview = useMemo(() => {
    return formatPeriodRange(previewYear, previewMonth, previewConfig);
  }, [previewConfig, previewYear, previewMonth]);

  const isUnchanged =
    startDay === budgetPeriodStartDay && endDay === budgetPeriodEndDay;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    const response = await fetch("/api/settings/budget-period", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        budgetPeriodStartDay: startDay,
        budgetPeriodEndDay: endDay,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Unable to save budget period settings");
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <p className="text-sm text-on-surface-variant">
        Set exactly when each budget month starts and ends. For salary cycles,
        pick your pay day as the start and the day before your next pay day as
        the end in the following month — for example, start 25 and end 24 gives
        May 25 through Jun 24.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            className="mb-2 block text-sm font-medium"
            htmlFor="budgetPeriodStartDay"
          >
            Start day
          </label>
          <select
            id="budgetPeriodStartDay"
            value={startDay}
            onChange={(event) => {
              setStartDay(Number(event.target.value));
              setSaved(false);
            }}
            className="w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-sm"
          >
            {Array.from({ length: MAX_BUDGET_PERIOD_DAY }, (_, index) => {
              const day = index + 1;
              return (
                <option key={day} value={day}>
                  {day === 1 ? "1 (calendar month start)" : dayLabel(day)}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label
            className="mb-2 block text-sm font-medium"
            htmlFor="budgetPeriodEndDay"
          >
            End day
          </label>
          <select
            id="budgetPeriodEndDay"
            value={endDay}
            onChange={(event) => {
              setEndDay(Number(event.target.value));
              setSaved(false);
            }}
            className="w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-sm"
          >
            {Array.from({ length: MAX_BUDGET_PERIOD_DAY }, (_, index) => {
              const day = index + 1;
              return (
                <option key={day} value={day}>
                  {day === 31 ? "31 (calendar month end)" : dayLabel(day)}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <p className="text-xs text-on-surface-variant">
        {isCalendarBudgetPeriod({ startDay, endDay })
          ? "Start 1 and end 31 uses normal calendar months."
          : "The end day falls in the month after the start month."}
      </p>

      <div className="rounded-lg bg-surface-container-low px-4 py-3 text-sm">
        <p className="font-medium text-on-surface">This month&apos;s date range</p>
        <p className="mt-1 text-on-surface-variant">{preview}</p>
      </div>

      {error ? <p className="text-sm text-error">{error}</p> : null}
      {saved ? (
        <p className="text-sm text-secondary">Budget period settings saved.</p>
      ) : null}

      <button
        type="submit"
        disabled={loading || isUnchanged}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary disabled:opacity-60"
      >
        {loading ? "Saving..." : "Save budget period"}
      </button>
    </form>
  );
}
