"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatPeriodLabel } from "@/lib/format";

export function ResetBudgetMonthButton({
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const monthLabel = formatPeriodLabel(year, month, {
    startDay: budgetPeriodStartDay,
    endDay: budgetPeriodEndDay,
  });

  async function handleReset() {
    const confirmed = window.confirm(
      `Reset ${monthLabel} to zero? All category budgets and wallet opening/added amounts for this month will become 0. Transaction logs will be kept.`,
    );

    if (!confirmed) return;

    setLoading(true);
    setError(null);

    const response = await fetch("/api/settings/reset-budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, month }),
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Unable to reset budget");
      return;
    }

    router.refresh();
  }

  return (
    <div className="mt-4">
      <p className="text-sm text-on-surface-variant">
        Set every category budget and wallet opening/added amount for{" "}
        <span className="font-medium text-on-surface">{monthLabel}</span> to{" "}
        <span className="font-medium text-on-surface">0</span>. Spending logs
        stay in place.
      </p>

      {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}

      <button
        type="button"
        onClick={handleReset}
        disabled={loading}
        className="mt-4 rounded-lg border border-error px-4 py-2 text-sm font-medium text-error disabled:opacity-60"
      >
        {loading ? "Resetting…" : "Reset month to zero"}
      </button>
    </div>
  );
}
