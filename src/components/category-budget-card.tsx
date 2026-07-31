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
  leftoverDiscarded?: boolean;
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
  const [customCarryAmount, setCustomCarryAmount] = useState("");
  const [showCustomCarry, setShowCustomCarry] = useState(false);

  const isComplete =
    category.budgetAmount > 0 && category.remaining <= 0;
  const isPartiallySpent =
    category.spent > 0 && category.remaining > 0;
  const lastMonthRemaining = category.lastMonthRemaining ?? 0;
  const carriedFromPrevious = category.carriedFromPrevious ?? 0;
  const leftoverDiscarded = category.leftoverDiscarded ?? false;
  const canCarryLeftover =
    lastMonthRemaining > 0 &&
    carriedFromPrevious <= 0 &&
    !leftoverDiscarded;
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
    carryAmount?: number;
    removeCarriedLeftover?: boolean;
    discardLeftover?: boolean;
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
    setShowCustomCarry(false);
    setCustomCarryAmount("");
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

  async function handleCarryLeftover(amount?: number) {
    if (!canCarryLeftover || loading) return;

    const carryAmount = amount ?? lastMonthRemaining;
    if (!Number.isFinite(carryAmount) || carryAmount <= 0) {
      setError("Enter an amount greater than zero");
      return;
    }
    if (carryAmount > lastMonthRemaining) {
      setError(
        `Amount cannot exceed leftover (${formatMoney(lastMonthRemaining)})`,
      );
      return;
    }

    const confirmed = window.confirm(
      `Add ${formatMoney(carryAmount)} leftover from ${lastMonthLabel ?? "last month"} to "${category.name}"?\n\nNew budget: ${formatMoney(category.budgetAmount + carryAmount)} (${formatMoney(category.budgetAmount)} + ${formatMoney(carryAmount)})`,
    );
    if (!confirmed) return;

    setLoading(true);
    setError(null);
    const success = await updateBudget({
      carryForwardLeftover: true,
      carryAmount,
    });
    setLoading(false);
    if (!success) return;
  }

  async function handleRemoveLeftover() {
    if (carriedFromPrevious <= 0 || loading) return;

    const confirmed = window.confirm(
      `Remove ${formatMoney(carriedFromPrevious)} leftover from "${category.name}"?\n\nBudget will go back to ${formatMoney(baseBudget)}.`,
    );
    if (!confirmed) return;

    setLoading(true);
    setError(null);
    const success = await updateBudget({ removeCarriedLeftover: true });
    setLoading(false);
    if (!success) return;
  }

  async function handleDiscardLeftover() {
    if (!canCarryLeftover || loading) return;

    const confirmed = window.confirm(
      `Discard ${formatMoney(lastMonthRemaining)} leftover from ${lastMonthLabel ?? "last month"} for "${category.name}"?\n\nIt will not be added to this month.`,
    );
    if (!confirmed) return;

    setLoading(true);
    setError(null);
    const success = await updateBudget({ discardLeftover: true });
    setLoading(false);
    if (!success) return;
  }

  async function handleCustomCarrySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await handleCarryLeftover(Number(customCarryAmount));
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
            {lastMonthLabel ?? "last month"}. Add all or a custom amount to this
            month&apos;s budget.
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleCarryLeftover()}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-on-primary disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">
                merge_type
              </span>
              Add full leftover ({formatMoney(lastMonthRemaining)})
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setShowCustomCarry((value) => !value);
                setCustomCarryAmount(String(lastMonthRemaining));
              }}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-white px-3 py-1.5 text-xs font-medium text-primary disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">edit</span>
              Custom amount
            </button>
            <button
              type="button"
              onClick={handleDiscardLeftover}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-full border border-outline-variant bg-white px-3 py-1.5 text-xs font-medium text-on-surface-variant disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">
                close
              </span>
              Discard leftover
            </button>
          </div>

          {showCustomCarry ? (
            <form
              onSubmit={handleCustomCarrySubmit}
              className="mt-3 flex flex-wrap items-end gap-2"
            >
              <div className="min-w-[8rem] flex-1">
                <label
                  htmlFor={`carry-${category.id}`}
                  className="mb-1 block text-xs font-medium text-on-surface-variant"
                >
                  Amount to add (max {formatMoney(lastMonthRemaining)})
                </label>
                <input
                  id={`carry-${category.id}`}
                  type="number"
                  min="1"
                  max={lastMonthRemaining}
                  step="1"
                  required
                  value={customCarryAmount}
                  onChange={(event) => setCustomCarryAmount(event.target.value)}
                  className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-on-primary disabled:opacity-60"
              >
                {loading ? "Adding…" : "Add amount"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCustomCarry(false);
                  setCustomCarryAmount("");
                }}
                disabled={loading}
                className="rounded-lg border border-outline-variant bg-white px-4 py-2 text-xs disabled:opacity-60"
              >
                Cancel
              </button>
            </form>
          ) : null}
        </div>
      ) : null}

      {carriedFromPrevious > 0 ? (
        <div className="mt-3 rounded-lg border border-secondary/20 bg-secondary-container/30 p-3">
          <p className="text-xs text-on-surface-variant">
            {formatMoney(carriedFromPrevious)} leftover from{" "}
            {lastMonthLabel ?? "last month"} is included in this budget.
          </p>
          <button
            type="button"
            onClick={handleRemoveLeftover}
            disabled={loading}
            className="mt-2 flex items-center gap-1.5 rounded-full border border-error/30 bg-white px-3 py-1.5 text-xs font-medium text-error disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base">undo</span>
            Remove leftover
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
