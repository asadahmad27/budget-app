"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type CreatedCategory = {
  id: string;
  name: string;
  walletId: string;
};

export function AddCategoryForm({
  walletId,
  year,
  month,
  onCreated,
  compact = false,
}: {
  walletId: string;
  year: number;
  month: number;
  onCreated?: (category: CreatedCategory) => void;
  compact?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletId,
        year,
        month,
        name: formData.get("name"),
        budgetAmount: Number(formData.get("budgetAmount") || 0),
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Unable to create category");
      return;
    }

    const data = await response.json();
    event.currentTarget.reset();
    setOpen(false);
    onCreated?.(data.category);
    router.refresh();
  }

  if (compact && !open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm font-medium text-secondary hover:underline"
      >
        <span className="material-symbols-outlined text-base">add</span>
        Add category
      </button>
    );
  }

  return (
    <div
      className={
        compact
          ? "mt-3 rounded-lg border border-outline-variant/30 bg-surface-container-low p-4"
          : "rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6"
      }
    >
      {!compact ? (
        <h3 className="text-lg font-semibold text-primary">Add category</h3>
      ) : null}

      <form className={`space-y-3 ${compact ? "" : "mt-4"}`} onSubmit={onSubmit}>
        <div>
          <label className="mb-2 block text-sm font-medium" htmlFor={`category-name-${walletId}`}>
            Category name
          </label>
          <input
            id={`category-name-${walletId}`}
            name="name"
            type="text"
            required
            placeholder="e.g. Petrol, Snacks"
            className="w-full rounded-lg border border-outline-variant px-4 py-3"
          />
        </div>
        <div>
          <label
            className="mb-2 block text-sm font-medium"
            htmlFor={`category-budget-${walletId}`}
          >
            Monthly budget (PKR)
          </label>
          <input
            id={`category-budget-${walletId}`}
            name="budgetAmount"
            type="number"
            min="0"
            step="1"
            defaultValue={0}
            className="w-full rounded-lg border border-outline-variant px-4 py-3"
          />
        </div>

        {error ? <p className="text-sm text-error">{error}</p> : null}

        <div className="flex gap-2">
          {compact ? (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-outline-variant px-4 py-2 text-sm"
            >
              Cancel
            </button>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary disabled:opacity-60"
          >
            {loading ? "Adding..." : "Add category"}
          </button>
        </div>
      </form>
    </div>
  );
}
