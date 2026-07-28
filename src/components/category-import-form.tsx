"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CategoryImportPreviewRow } from "@/lib/category-import";
import { formatMoney } from "@/lib/format";

type PreviewResponse = {
  rows: CategoryImportPreviewRow[];
  notInPaste: Array<{ id: string; name: string; budgetAmount: number }>;
  summary: {
    createCount: number;
    updateCount: number;
    unchangedCount: number;
  };
};

function actionLabel(row: CategoryImportPreviewRow) {
  if (row.action === "create") return "Create new";
  if (row.excluded) return "Restore & update";
  if (row.action === "update") return "Update budget";
  return "No change";
}

export function CategoryImportForm({
  walletId,
  year,
  month,
}: {
  walletId: string;
  year: number;
  month: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [hideMissing, setHideMissing] = useState(false);
  const [loading, setLoading] = useState<"preview" | "apply" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadPreview() {
    setLoading("preview");
    setError(null);
    setPreview(null);

    const response = await fetch("/api/categories/import/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletId, year, month, text }),
    });

    setLoading(null);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Unable to preview import");
      return;
    }

    setPreview(await response.json());
  }

  async function applyImport() {
    if (!preview) return;

    const confirmed = window.confirm(
      `Apply ${preview.summary.createCount} new and ${preview.summary.updateCount} updated categories for this month?`,
    );
    if (!confirmed) return;

    setLoading("apply");
    setError(null);

    const response = await fetch("/api/categories/import/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletId,
        year,
        month,
        hideMissing,
        rows: preview.rows.map((row) => ({
          name: row.name,
          budgetAmount: row.budgetAmount,
        })),
      }),
    });

    setLoading(null);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Unable to apply import");
      return;
    }

    setText("");
    setPreview(null);
    setHideMissing(false);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-outline-variant px-4 py-3 text-sm font-medium text-primary"
      >
        <span className="material-symbols-outlined text-base">content_paste</span>
        Paste categories from Excel
      </button>
    );
  }

  return (
    <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-primary">
            Paste from Excel
          </h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            Copy two columns from Excel — category name and budget — then paste
            here. Tabs, commas, or spaces between columns work.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setPreview(null);
            setError(null);
          }}
          className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-low"
          aria-label="Close import"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-medium" htmlFor="category-paste">
          Pasted rows
        </label>
        <textarea
          id="category-paste"
          rows={8}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setPreview(null);
          }}
          placeholder={`Category\tBudget\nRent\t28000\nGrocery\t20000\nPetrol\t10000`}
          className="w-full rounded-lg border border-outline-variant px-4 py-3 font-mono text-sm"
        />
      </div>

      <button
        type="button"
        onClick={loadPreview}
        disabled={loading !== null || text.trim().length === 0}
        className="mt-3 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-on-secondary disabled:opacity-60"
      >
        {loading === "preview" ? "Checking..." : "Preview import"}
      </button>

      {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}

      {preview ? (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-primary-container px-3 py-1 text-on-primary-container">
              {preview.summary.createCount} new
            </span>
            <span className="rounded-full bg-secondary-container px-3 py-1 text-on-secondary-container">
              {preview.summary.updateCount} updates
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
                    key={`${row.lineNumber}-${row.name}`}
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
                            was {formatMoney(row.currentBudget)}
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

          {preview.notInPaste.length > 0 ? (
            <div className="rounded-lg bg-surface-container-low p-4">
              <p className="text-sm font-medium text-primary">
                Not in your paste
              </p>
              <p className="mt-1 text-xs text-on-surface-variant">
                {preview.notInPaste.map((category) => category.name).join(", ")}
              </p>
              <label className="mt-3 flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  checked={hideMissing}
                  onChange={(event) => setHideMissing(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-outline-variant text-primary"
                />
                <span className="text-sm text-on-surface-variant">
                  Hide these categories from this month (only if they have no
                  spending logged)
                </span>
              </label>
            </div>
          ) : null}

          <button
            type="button"
            onClick={applyImport}
            disabled={loading !== null}
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-on-primary disabled:opacity-60"
          >
            {loading === "apply" ? "Applying..." : "Apply changes"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
