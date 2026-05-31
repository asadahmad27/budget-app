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
};

export function CategoryBudgetCard({
  category,
  walletId,
  year,
  month,
}: {
  category: CategoryItem;
  walletId: string;
  year: number;
  month: number;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isComplete =
    category.budgetAmount > 0 && category.remaining <= 0;
  const isPartiallySpent =
    category.spent > 0 && category.remaining > 0;
  const amountToLogOnDone =
    category.remaining > 0
      ? category.remaining
      : category.spent === 0
        ? category.budgetAmount
        : 0;

  async function updateBudget(payload: {
    budgetAmount?: number;
    complete?: boolean;
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
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
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
          </div>
          <p className="text-xs text-on-surface-variant">
            Remaining {formatMoney(category.remaining)}
          </p>
        </div>

        <p className="font-semibold text-primary">
          {formatMoney(category.budgetAmount)}
        </p>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-[#E2E8F0]">
        <div
          className={`h-full ${category.spent > category.budgetAmount ? "bg-error" : "bg-secondary"}`}
          style={{
            width: `${Math.min(category.progress * 100, 100)}%`,
          }}
        />
      </div>

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
