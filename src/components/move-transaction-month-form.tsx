"use client";

import { FormEvent, useState } from "react";
import { formatMonthLabel } from "@/lib/format";

const MONTHS = [
  { value: 1, label: "Jan" },
  { value: 2, label: "Feb" },
  { value: 3, label: "Mar" },
  { value: 4, label: "Apr" },
  { value: 5, label: "May" },
  { value: 6, label: "Jun" },
  { value: 7, label: "Jul" },
  { value: 8, label: "Aug" },
  { value: 9, label: "Sep" },
  { value: 10, label: "Oct" },
  { value: 11, label: "Nov" },
  { value: 12, label: "Dec" },
];

export function MoveTransactionMonthForm({
  transactionId,
  fromYear,
  fromMonth,
  onCancel,
  onMoved,
}: {
  transactionId: string;
  fromYear: number;
  fromMonth: number;
  onCancel: () => void;
  onMoved: () => void;
}) {
  const defaultTarget =
    fromMonth === 12
      ? { year: fromYear + 1, month: 1 }
      : { year: fromYear, month: fromMonth + 1 };
  const [toYear, setToYear] = useState(defaultTarget.year);
  const [toMonth, setToMonth] = useState(defaultTarget.month);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSameMonth = toYear === fromYear && toMonth === fromMonth;
  const fromLabel = formatMonthLabel(fromYear, fromMonth);
  const toLabel = formatMonthLabel(toYear, toMonth);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSameMonth) {
      setError("Choose a different month");
      return;
    }

    const confirmed = window.confirm(
      `Move this expense to ${toLabel}? It will no longer count toward ${fromLabel}.`,
    );
    if (!confirmed) return;

    setLoading(true);
    setError(null);

    const response = await fetch(`/api/transactions/${transactionId}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year: toYear, month: toMonth }),
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Unable to move transaction");
      return;
    }

    onMoved();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-4 space-y-3 rounded-lg border border-outline-variant/30 bg-white p-4"
    >
      <p className="text-sm font-medium text-primary">Move to another budget month</p>
      <p className="text-xs text-on-surface-variant">
        Currently counted in {fromLabel}. Pick where this spending should apply.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium" htmlFor={`move-year-${transactionId}`}>
            Year
          </label>
          <input
            id={`move-year-${transactionId}`}
            type="number"
            min={2000}
            max={2100}
            required
            value={toYear}
            onChange={(event) => setToYear(Number(event.target.value))}
            className="w-full rounded-lg border border-outline-variant px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium" htmlFor={`move-month-${transactionId}`}>
            Month
          </label>
          <select
            id={`move-month-${transactionId}`}
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

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 rounded-lg border border-outline-variant px-3 py-2 text-sm font-medium disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || isSameMonth}
          className="flex-1 rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-on-secondary disabled:opacity-60"
        >
          {loading ? "Moving…" : `Move to ${toLabel}`}
        </button>
      </div>
    </form>
  );
}
