"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatMoney } from "@/lib/format";

type CopyPreviewRow = {
  categoryId: string;
  name: string;
  budgetAmount: number;
  action: "update" | "unchanged";
  currentBudget?: number;
  excluded?: boolean;
  lineNumber: number;
};

type CopyPreviewResponse = {
  sourceLabel: string;
  rows: CopyPreviewRow[];
  notInLastMonth: Array<{ id: string; name: string; budgetAmount: number }>;
  summary: {
    updateCount: number;
    unchangedCount: number;
  };
};

function actionLabel(row: CopyPreviewRow) {
  if (row.excluded) return "Restore & copy";
  if (row.action === "update") return "Copy budget";
  return "No change";
}

export function CopyLastMonthBudget({
  walletId,
  year,
  month,
}: {
  walletId: string;
  year: number;
  month: number;
}) {
  const router = useRouter();
  const [preview, setPreview] = useState<CopyPreviewResponse | null>(null);
  const [hideMissing, setHideMissing] = useState(false);
  const [loading, setLoading] = useState<"preview" | "apply" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadPreview() {
    setLoading("preview");
    setError(null);

    const response = await fetch("/api/categories/copy-last-month/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletId, year, month }),
    });

    setLoading(null);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Unable to load last month");
      setPreview(null);
      return;
    }

    setPreview(await response.json());
  }

  async function applyCopy() {
    if (!preview) return;

    const confirmed = window.confirm(
      `Copy ${preview.rows.length} category budgets from ${preview.sourceLabel} into this month?`,
    );
    if (!confirmed) return;

    setLoading("apply");
    setError(null);

    const response = await fetch("/api/categories/copy-last-month/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletId, year, month, hideMissing }),
    });

    setLoading(null);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Unable to copy last month");
      return;
    }

    setPreview(null);
    setHideMissing(false);
    router.refresh();
  }

  return (
    <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6">
      <h3 className="text-lg font-semibold text-primary">Copy last month</h3>
      <p className="mt-1 text-sm text-on-surface-variant">
        Bring forward last month&apos;s category names and budgets for this
        wallet so you don&apos;t set them up again.
      </p>

      {!preview ? (
        <button
          type="button"
          onClick={loadPreview}
          disabled={loading !== null}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary-container px-4 py-3 text-sm font-medium text-on-primary-container disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-base">history</span>
          {loading === "preview" ? "Loading..." : "Preview last month"}
        </button>
      ) : (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-on-surface-variant">
            Copying from <span className="font-medium text-on-surface">{preview.sourceLabel}</span>
          </p>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-secondary-container px-3 py-1 text-on-secondary-container">
              {preview.summary.updateCount} to apply
            </span>
            <span className="rounded-full bg-surface-container-high px-3 py-1 text-on-surface-variant">
              {preview.summary.unchangedCount} unchanged
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-outline-variant/30">
            <table className="min-w-full text-sm">
              <thead className="bg-surface-container-low text-left text-xs uppercase tracking-wide text-on-surface-variant">
                <tr>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Budget</th>
                  <th className="px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr
                    key={row.categoryId}
                    className="border-t border-outline-variant/20"
                  >
                    <td className="px-3 py-2 font-medium">{row.name}</td>
                    <td className="px-3 py-2">
                      {row.currentBudget !== undefined &&
                      row.action === "update" &&
                      row.currentBudget !== row.budgetAmount ? (
                        <span>
                          {formatMoney(row.budgetAmount)}
                          <span className="ml-2 text-xs text-on-surface-variant">
                            now {formatMoney(row.currentBudget)}
                          </span>
                        </span>
                      ) : (
                        formatMoney(row.budgetAmount)
                      )}
                    </td>
                    <td className="px-3 py-2 text-on-surface-variant">
                      {actionLabel(row)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {preview.notInLastMonth.length > 0 ? (
            <div className="rounded-lg bg-surface-container-low p-4">
              <p className="text-sm font-medium text-primary">
                Not in last month
              </p>
              <p className="mt-1 text-xs text-on-surface-variant">
                {preview.notInLastMonth.map((category) => category.name).join(", ")}
              </p>
              <label className="mt-3 flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  checked={hideMissing}
                  onChange={(event) => setHideMissing(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-outline-variant text-primary"
                />
                <span className="text-sm text-on-surface-variant">
                  Hide these from this month (only if they have no spending
                  logged)
                </span>
              </label>
            </div>
          ) : null}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                setHideMissing(false);
                setError(null);
              }}
              disabled={loading !== null}
              className="flex-1 rounded-lg border border-outline-variant px-4 py-3 text-sm font-medium disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={applyCopy}
              disabled={loading !== null}
              className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-on-primary disabled:opacity-60"
            >
              {loading === "apply" ? "Copying..." : "Apply copy"}
            </button>
          </div>
        </div>
      )}

      {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}
    </section>
  );
}
