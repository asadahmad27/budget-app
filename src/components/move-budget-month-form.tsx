"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { formatPeriodLabel } from "@/lib/format";
import { writeDashboardPeriod } from "@/lib/dashboard-period";

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export function MoveBudgetMonthForm({
  year,
  month,
  budgetPeriodStartDay = 1,
  budgetPeriodEndDay = 31,
}: {
  year: number;
  month: number;
  budgetPeriodStartDay?: number;
  budgetPeriodEndDay?: number;
}) {
  const router = useRouter();
  const defaultTarget =
    month === 12
      ? { year: year + 1, month: 1 }
      : { year, month: month + 1 };
  const [toYear, setToYear] = useState(defaultTarget.year);
  const [toMonth, setToMonth] = useState(defaultTarget.month);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const budgetPeriod = {
    startDay: budgetPeriodStartDay,
    endDay: budgetPeriodEndDay,
  };
  const fromLabel = formatPeriodLabel(year, month, budgetPeriod);
  const toLabel = formatPeriodLabel(toYear, toMonth, budgetPeriod);
  const isSameMonth = year === toYear && month === toMonth;

  async function submit(replaceExisting = false) {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/settings/budget-month", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromYear: year,
        fromMonth: month,
        toYear,
        toMonth,
        replaceExisting,
      }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      if (
        !replaceExisting &&
        data.error?.includes("Confirm replace to overwrite")
      ) {
        const confirmed = window.confirm(
          `${toLabel} already has a budget. Replace it with ${fromLabel}? Any empty budget there will be removed.`,
        );
        if (confirmed) {
          await submit(true);
        }
        return;
      }

      setError(data.error ?? "Unable to move budget");
      return;
    }

    writeDashboardPeriod({ year: toYear, month: toMonth });
    router.push(`/dashboard?year=${toYear}&month=${toMonth}`);
    router.refresh();
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (isSameMonth) {
      setError("Choose a different month");
      return;
    }

    const confirmed = window.confirm(
      `Move ${fromLabel}'s budget (categories, balances, transactions) to ${toLabel}?`,
    );

    if (confirmed) {
      void submit();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <p className="text-sm text-on-surface-variant">
        Move <span className="font-medium text-on-surface">{fromLabel}</span> to
        another month. Use this if you set up the wrong month by mistake.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="move-budget-year"
            className="mb-1 block text-xs font-medium text-on-surface-variant"
          >
            Target year
          </label>
          <input
            id="move-budget-year"
            type="number"
            min={2000}
            max={2100}
            value={toYear}
            onChange={(event) => setToYear(Number(event.target.value))}
            className="w-full rounded-lg border border-outline-variant px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="move-budget-month"
            className="mb-1 block text-xs font-medium text-on-surface-variant"
          >
            Target month
          </label>
          <select
            id="move-budget-month"
            value={toMonth}
            onChange={(event) => setToMonth(Number(event.target.value))}
            className="w-full rounded-lg border border-outline-variant px-3 py-2 text-sm"
          >
            {MONTHS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? <p className="text-sm text-error">{error}</p> : null}

      <button
        type="submit"
        disabled={loading || isSameMonth}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary disabled:opacity-60"
      >
        {loading ? "Moving…" : `Move to ${toLabel}`}
      </button>
    </form>
  );
}
