"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { formatMoney } from "@/lib/format";

type FundEntry = {
  id: string;
  amount: number;
  note: string | null;
  date: Date | string;
};

export function FundEntriesList({ entries }: { entries: FundEntry[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(entry: FundEntry) {
    const label = entry.note?.trim() || "this fund entry";
    const confirmed = window.confirm(
      `Delete ${formatMoney(entry.amount)} (${label})?`,
    );
    if (!confirmed) return;

    setBusyId(entry.id);
    setError(null);

    const response = await fetch(`/api/wallets/fund-entries/${entry.id}`, {
      method: "DELETE",
    });

    setBusyId(null);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Unable to delete fund entry");
      return;
    }

    if (editingId === entry.id) {
      setEditingId(null);
    }

    router.refresh();
  }

  async function handleSave(event: FormEvent<HTMLFormElement>, entryId: string) {
    event.preventDefault();
    setBusyId(entryId);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const response = await fetch(`/api/wallets/fund-entries/${entryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Number(formData.get("amount")),
        note: String(formData.get("note") ?? "").trim() || undefined,
      }),
    });

    setBusyId(null);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Unable to update fund entry");
      return;
    }

    setEditingId(null);
    router.refresh();
  }

  if (entries.length === 0) {
    return (
      <p className="text-sm text-on-surface-variant">
        No add-funds entries this month yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-primary">Added funds this month</h4>

      {error ? <p className="text-sm text-error">{error}</p> : null}

      <div className="space-y-2">
        {entries.map((entry) => {
          const isEditing = editingId === entry.id;
          const isBusy = busyId === entry.id;
          const date =
            typeof entry.date === "string" ? new Date(entry.date) : entry.date;

          return (
            <div
              key={entry.id}
              className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-secondary">
                    +{formatMoney(entry.amount)}
                  </p>
                  <p className="truncate text-xs text-on-surface-variant">
                    {date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                    {entry.note ? ` • ${entry.note}` : ""}
                  </p>
                </div>

                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => {
                      setError(null);
                      setEditingId(isEditing ? null : entry.id);
                    }}
                    className="rounded-full p-2 text-on-surface-variant hover:bg-white hover:text-primary disabled:opacity-60"
                    aria-label="Edit fund entry"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {isEditing ? "close" : "edit"}
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleDelete(entry)}
                    className="rounded-full p-2 text-on-surface-variant hover:bg-white hover:text-error disabled:opacity-60"
                    aria-label="Delete fund entry"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {isBusy ? "hourglass_empty" : "delete"}
                    </span>
                  </button>
                </div>
              </div>

              {isEditing ? (
                <form
                  onSubmit={(event) => handleSave(event, entry.id)}
                  className="mt-3 space-y-3 rounded-lg bg-white p-3"
                >
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Amount (PKR)
                    </label>
                    <input
                      name="amount"
                      type="number"
                      min="1"
                      step="1"
                      required
                      defaultValue={entry.amount}
                      className="w-full rounded-lg border border-outline-variant px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Note
                    </label>
                    <input
                      name="note"
                      type="text"
                      defaultValue={entry.note ?? ""}
                      placeholder="e.g. Salary"
                      className="w-full rounded-lg border border-outline-variant px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      disabled={isBusy}
                      className="flex-1 rounded-lg border border-outline-variant px-3 py-2 text-sm disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isBusy}
                      className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-on-primary disabled:opacity-60"
                    >
                      {isBusy ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
