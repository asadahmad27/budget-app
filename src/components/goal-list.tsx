"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { LifeGoalItem, LifeGoalsSummary } from "@/lib/goals";
import { formatMoney } from "@/lib/format";

type WalletOption = {
  id: string;
  name: string;
  color: string;
};

export function GoalList({
  goals,
  summary,
  wallets,
}: {
  goals: LifeGoalItem[];
  summary: LifeGoalsSummary;
  wallets: WalletOption[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function deleteGoal(goal: LifeGoalItem) {
    const confirmed = window.confirm(`Delete goal "${goal.name}"?`);
    if (!confirmed) return;

    setUpdatingId(goal.id);
    setError(null);

    const response = await fetch(`/api/goals/${goal.id}`, {
      method: "DELETE",
    });

    setUpdatingId(null);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Unable to delete goal");
      return;
    }

    if (editingId === goal.id) {
      setEditingId(null);
    }

    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-primary-container p-3">
          <p className="text-[10px] text-on-primary-container/80">Target</p>
          <p className="mt-1 text-sm font-bold text-on-primary-container">
            {formatMoney(summary.totalProjected)}
          </p>
        </div>
        <div className="rounded-xl bg-secondary-container p-3">
          <p className="text-[10px] text-on-secondary-container/80">Saved</p>
          <p className="mt-1 text-sm font-bold text-on-secondary-container">
            {formatMoney(summary.totalSaved)}
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-high p-3">
          <p className="text-[10px] text-on-surface-variant">To go</p>
          <p className="mt-1 text-sm font-bold text-on-surface">
            {formatMoney(summary.totalRemaining)}
          </p>
        </div>
      </div>

      {error ? <p className="text-sm text-error">{error}</p> : null}

      {goals.length === 0 ? (
        <div className="rounded-lg bg-surface-container-low p-4 text-sm text-on-surface-variant">
          No goals yet. Add something you are saving toward — car, house, Umrah,
          or anything else.
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => {
            const isEditing = editingId === goal.id;
            const isUpdating = updatingId === goal.id;
            const percent = Math.round(goal.progress * 100);
            const isComplete = goal.savedAmount >= goal.projectedCost;

            return (
              <div
                key={goal.id}
                className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-on-surface">{goal.name}</p>
                      {isComplete ? (
                        <span className="rounded-full bg-secondary-container px-2 py-0.5 text-[11px] font-medium text-on-secondary-container">
                          Funded
                        </span>
                      ) : null}
                    </div>
                    {goal.note ? (
                      <p className="mt-1 text-sm text-on-surface-variant">
                        {goal.note}
                      </p>
                    ) : null}
                    {goal.walletName ? (
                      <p className="mt-2 flex items-center gap-2 text-xs text-on-surface-variant">
                        {goal.walletColor ? (
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: goal.walletColor }}
                          />
                        ) : null}
                        Saved in {goal.walletName}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => {
                        setError(null);
                        setEditingId(isEditing ? null : goal.id);
                      }}
                      className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-low hover:text-primary disabled:opacity-60"
                      aria-label={`Edit ${goal.name}`}
                    >
                      <span className="material-symbols-outlined text-xl">
                        {isEditing ? "close" : "edit"}
                      </span>
                    </button>
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => deleteGoal(goal)}
                      className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-low hover:text-error disabled:opacity-60"
                      aria-label={`Delete ${goal.name}`}
                    >
                      <span className="material-symbols-outlined text-xl">
                        delete
                      </span>
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">
                      {formatMoney(goal.savedAmount)} saved
                    </span>
                    <span className="font-medium text-primary">
                      {formatMoney(goal.projectedCost)} target
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                    <div
                      className={`h-full transition-all ${isComplete ? "bg-secondary" : "bg-primary"}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {isComplete
                      ? "Goal amount reached"
                      : `${formatMoney(goal.remaining)} left · ${percent}%`}
                  </p>
                </div>

                {isEditing ? (
                  <EditGoalForm
                    goal={goal}
                    wallets={wallets}
                    disabled={isUpdating}
                    onCancel={() => setEditingId(null)}
                    onSaved={() => {
                      setEditingId(null);
                      router.refresh();
                    }}
                    onError={setError}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EditGoalForm({
  goal,
  wallets,
  disabled,
  onCancel,
  onSaved,
  onError,
}: {
  goal: LifeGoalItem;
  wallets: WalletOption[];
  disabled: boolean;
  onCancel: () => void;
  onSaved: () => void;
  onError: (message: string | null) => void;
}) {
  const [walletId, setWalletId] = useState(goal.walletId ?? "");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    onError(null);

    const formData = new FormData(event.currentTarget);

    const response = await fetch(`/api/goals/${goal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(formData.get("name") ?? ""),
        note: String(formData.get("note") ?? "").trim() || undefined,
        projectedCost: Number(formData.get("projectedCost")),
        savedAmount: Number(formData.get("savedAmount")),
        walletId: walletId || null,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json();
      onError(data.error ?? "Unable to update goal");
      return;
    }

    onSaved();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-4 space-y-3 rounded-lg border border-outline-variant/30 bg-surface-container-low p-4"
    >
      <p className="text-sm font-medium text-primary">Edit goal</p>

      <div>
        <label className="mb-1 block text-xs font-medium">Goal name</label>
        <input
          name="name"
          type="text"
          required
          defaultValue={goal.name}
          className="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium">Notes</label>
        <textarea
          name="note"
          rows={2}
          defaultValue={goal.note ?? ""}
          className="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium">
            Projected cost (PKR)
          </label>
          <input
            name="projectedCost"
            type="number"
            min="1"
            step="1"
            required
            defaultValue={goal.projectedCost}
            className="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">
            Saved so far (PKR)
          </label>
          <input
            name="savedAmount"
            type="number"
            min="0"
            step="1"
            required
            defaultValue={goal.savedAmount}
            className="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium">Savings wallet</label>
        <select
          value={walletId}
          onChange={(event) => setWalletId(event.target.value)}
          className="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm"
        >
          <option value="">Not linked</option>
          {wallets.map((wallet) => (
            <option key={wallet.id} value={wallet.id}>
              {wallet.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading || disabled}
          className="flex-1 rounded-lg border border-outline-variant px-3 py-2 text-sm font-medium disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || disabled}
          className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-on-primary disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
