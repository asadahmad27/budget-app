"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { resolveActivePeriod } from "@/lib/dashboard-period";
import { formatMoney } from "@/lib/format";

type CategoryItem = {
  id: string;
  name: string;
  budgetAmount: number;
  spent: number;
  remaining: number;
  progress: number;
  lastMonthRemaining?: number;
  carriedFromPrevious?: number;
};

export function CategoryBudgetCard({
  category,
  walletId,
  year,
  month,
  lastMonthLabel,
}: {
  category: CategoryItem;
  walletId: string;
  year: number;
  month: number;
  lastMonthLabel?: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isComplete =
    category.budgetAmount > 0 && category.remaining <= 0;
  const isPartiallySpent =
    category.spent > 0 && category.remaining > 0;
  const lastMonthRemaining = category.lastMonthRemaining ?? 0;
  const carriedFromPrevious = category.carriedFromPrevious ?? 0;
  const canCarryLeftover =
    lastMonthRemaining > 0 && carriedFromPrevious <= 0;
  const baseBudget = Math.max(0, category.budgetAmount - carriedFromPrevious);
  const amountToLogOnDone =
    category.remaining > 0
      ? category.remaining
      : category.spent === 0
        ? category.budgetAmount
        : 0;

  async function updateBudget(payload: {
    budgetAmount?: number;
    complete?: boolean;
    carryForwardLeftover?: boolean;
  }) {
    const response = await fetch(`/api/categories/${category.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        year,
        month,
        ...payload,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Unable to update category budget");
      return false;
    }

    setEditing(false);
    router.refresh();
    return true;
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const success = await updateBudget({
      budgetAmount: Number(formData.get("budgetAmount")),
    });

    setLoading(false);
    return success;
  }

  async function handleRemoveFromMonth() {
    const confirmed = window.confirm(
      `Remove "${category.name}" from this month? It stays on the wallet for other months.`,
    );
    if (!confirmed) return;

    setLoading(true);
    setError(null);

    const response = await fetch(`/api/categories/${category.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, month, excluded: true }),
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Unable to remove category from this month");
      return;
    }

    router.refresh();
  }

  async function handleCarryLeftover() {
    if (!canCarryLeftover || loading) return;

    const confirmed = window.confirm(
      `Add ${formatMoney(lastMonthRemaining)} leftover from ${lastMonthLabel ?? "last month"} to "${category.name}"?\n\nNew budget: ${formatMoney(category.budgetAmount + lastMonthRemaining)} (${formatMoney(category.budgetAmount)} + ${formatMoney(lastMonthRemaining)})`,
    );
    if (!confirmed) return;

    setLoading(true);
    setError(null);
    const success = await updateBudget({ carryForwardLeftover: true });
    setLoading(false);
    if (!success) return;
  }

  async function handleMarkDone() {
    if (isComplete || loading) return;

    setLoading(true);
    setError(null);

    if (amountToLogOnDone > 0) {
      const activePeriod = resolveActivePeriod({ year, month });
      const transactionResponse = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: activePeriod.year,
          month: activePeriod.month,
          walletId,
          categoryId: category.id,
          amount: amountToLogOnDone,
          description: `${category.name} — marked done`,
        }),
      });

      if (!transactionResponse.ok) {
        const data = await transactionResponse.json();
        setLoading(false);
        setError(data.error ?? "Unable to log spending");
        return;
      }
    }

    const success = await updateBudget({ complete: true });
    setLoading(false);

    if (!success) return;
  }

  function startEditing() {
    setError(null);
    setEditing(true);
  }

  const logSpendingHref = `/transactions/new?year=${year}&month=${month}&wallet=${walletId}&category=${category.id}&returnTo=${encodeURIComponent(`/wallets?wallet=${walletId}&year=${year}&month=${month}`)}`;

  return (
    <div
      className={`rounded-xl bg-surface-container-lowest p-5 shadow-sm ${
        isComplete ? "ring-1 ring-secondary/30" : ""
      } ${canCarryLeftover ? "ring-1 ring-primary/20" : ""}`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold">{category.name}</h4>
            {isComplete ? (
              <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-medium text-secondary">
                Complete
              </span>
            ) : isPartiallySpent ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                In progress
              </span>
            ) : null}
            {canCarryLeftover ? (
              <span className="rounded-full bg-primary-container px-2 py-0.5 text-xs font-medium text-on-primary-container">
                {formatMoney(lastMonthRemaining)} left from{" "}
                {lastMonthLabel ?? "last month"}
              </span>
            ) : null}
            {carriedFromPrevious > 0 ? (
              <span className="rounded-full bg-secondary-container px-2 py-0.5 text-xs font-medium text-on-secondary-container">
                +{formatMoney(carriedFromPrevious)} leftover added
              </span>
            ) : null}
          </div>
          <p className="text-xs text-on-surface-variant">
            Remaining {formatMoney(category.remaining)}
          </p>
        </div>

        <div className="text-right">
          <p className="font-semibold text-primary">
            {formatMoney(category.budgetAmount)}
          </p>
          {carriedFromPrevious > 0 ? (
            <p className="text-[11px] text-on-surface-variant">
              {formatMoney(baseBudget)} + {formatMoney(carriedFromPrevious)}
            </p>
          ) : null}
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-[#E2E8F0]">
        <div
          className={`h-full ${category.spent > category.budgetAmount ? "bg-error" : "bg-secondary"}`}
          style={{
            width: `${Math.min(category.progress * 100, 100)}%`,
          }}
        />
      </div>

      {canCarryLeftover ? (
        <div className="mt-3 rounded-lg border border-primary/20 bg-primary-container/20 p-3">
          <p className="text-xs text-on-surface-variant">
            {formatMoney(lastMonthRemaining)} unfinished from{" "}
            {lastMonthLabel ?? "last month"}. Add it to this month&apos;s budget
            so you can finish it here.
          </p>
          <button
            type="button"
            onClick={handleCarryLeftover}
            disabled={loading}
            className="mt-2 flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-on-primary disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base">
              merge_type
            </span>
            Add leftover ({formatMoney(lastMonthRemaining)})
          </button>
        </div>
      ) : null}

      <div className="mt-3 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-on-surface-variant">
            Spent {formatMoney(category.spent)}
          </p>

          {!editing && !isComplete ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleMarkDone}
                disabled={loading || category.budgetAmount <= 0}
                className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-on-secondary transition-colors hover:bg-secondary/90 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">
                  {loading ? "hourglass_empty" : "check_circle"}
                </span>
                Mark done
              </button>
              <Link
                href={logSpendingHref}
                className="flex items-center gap-1.5 rounded-full bg-surface-container-low px-3 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:bg-primary/10 hover:text-primary"
              >
                <span className="material-symbols-outlined text-base">add</span>
                Log spending
              </Link>
              <button
                type="button"
                onClick={startEditing}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-full bg-surface-container-low px-3 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">edit</span>
                Edit budget
              </button>
              <button
                type="button"
                onClick={handleRemoveFromMonth}
                disabled={loading || category.spent > 0}
                className="flex items-center gap-1.5 rounded-full bg-surface-container-low px-3 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:bg-error/10 hover:text-error disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">
                  visibility_off
                </span>
                Remove month
              </button>
            </div>
          ) : null}

          {!editing && isComplete ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Link
                href={logSpendingHref}
                className="flex items-center gap-1.5 rounded-full bg-surface-container-low px-3 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:bg-primary/10 hover:text-primary"
              >
                <span className="material-symbols-outlined text-base">add</span>
                Log spending
              </Link>
              <div className="flex items-center gap-1.5 text-xs font-medium text-secondary">
                <span className="material-symbols-outlined text-base">check_circle</span>
                Done
              </div>
            </div>
          ) : null}
        </div>

        {!editing && !isComplete && category.spent > 0 ? (
          <p className="text-xs text-on-surface-variant">
            Remove month is disabled while this category has spending logged.
          </p>
        ) : null}

        {!editing && !isComplete && amountToLogOnDone > 0 ? (
          <p className="text-xs text-on-surface-variant">
            Mark done logs {formatMoney(amountToLogOnDone)} in this category.
          </p>
        ) : null}

        {editing ? (
          <form
            onSubmit={handleSave}
            className="flex flex-wrap items-end gap-2 rounded-lg bg-surface-container-low p-3"
          >
            <div className="min-w-[8rem] flex-1">
              <label
                htmlFor={`budget-${category.id}`}
                className="mb-1 block text-xs font-medium text-on-surface-variant"
              >
                Monthly budget (PKR)
              </label>
              <input
                id={`budget-${category.id}`}
                name="budgetAmount"
                type="number"
                min="0"
                step="1"
                defaultValue={category.budgetAmount}
                autoFocus
                className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-on-primary disabled:opacity-60"
            >
              {loading ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setError(null);
              }}
              disabled={loading}
              className="rounded-lg border border-outline-variant bg-white px-4 py-2 text-xs disabled:opacity-60"
            >
              Cancel
            </button>
          </form>
        ) : null}
      </div>

      {error ? <p className="mt-2 text-xs text-error">{error}</p> : null}
    </div>
  );
}
