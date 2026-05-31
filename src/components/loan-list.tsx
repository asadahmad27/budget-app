"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { LoanItem, LoanSummary } from "@/lib/loans";
import { formatMoney } from "@/lib/format";

type Filter = "all" | "given" | "taken" | "active" | "settled";

export function LoanList({
  loans,
  summary,
}: {
  loans: LoanItem[];
  summary: LoanSummary;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("active");
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      if (filter === "given") return loan.direction === "given";
      if (filter === "taken") return loan.direction === "taken";
      if (filter === "active") return !loan.settled;
      if (filter === "settled") return loan.settled;
      return true;
    });
  }, [filter, loans]);

  async function updateLoan(
    loanId: string,
    payload: Record<string, unknown>,
  ) {
    setUpdatingId(loanId);
    setError(null);

    const response = await fetch(`/api/loans/${loanId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setUpdatingId(null);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Unable to update loan");
      return;
    }

    router.refresh();
  }

  async function deleteLoan(loan: LoanItem) {
    const confirmed = window.confirm(
      `Delete loan with ${loan.personName} (${formatMoney(loan.amount)})?`,
    );
    if (!confirmed) return;

    setUpdatingId(loan.id);
    setError(null);

    const response = await fetch(`/api/loans/${loan.id}`, {
      method: "DELETE",
    });

    setUpdatingId(null);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Unable to delete loan");
      return;
    }

    router.refresh();
  }

  const filters: { id: Filter; label: string }[] = [
    { id: "active", label: "Active" },
    { id: "given", label: "I lent" },
    { id: "taken", label: "I borrowed" },
    { id: "settled", label: "Settled" },
    { id: "all", label: "All" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-secondary-container p-4">
          <p className="text-xs text-on-secondary-container/80">They owe you</p>
          <p className="mt-1 text-xl font-bold text-on-secondary-container">
            {formatMoney(summary.givenOutstanding)}
          </p>
        </div>
        <div className="rounded-xl bg-primary-container p-4">
          <p className="text-xs text-on-primary-container/80">You owe</p>
          <p className="mt-1 text-xl font-bold text-on-primary-container">
            {formatMoney(summary.takenOutstanding)}
          </p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${
              filter === item.id
                ? "bg-primary text-on-primary"
                : "bg-surface-container-low text-on-surface-variant"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? <p className="text-sm text-error">{error}</p> : null}

      {filteredLoans.length === 0 ? (
        <div className="rounded-lg bg-surface-container-low p-4 text-sm text-on-surface-variant">
          No loans in this view yet.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLoans.map((loan) => {
            const isGiven = loan.direction === "given";
            const isUpdating = updatingId === loan.id;

            return (
              <div
                key={loan.id}
                className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          isGiven
                            ? "bg-secondary-container text-on-secondary-container"
                            : "bg-primary-container text-on-primary-container"
                        }`}
                      >
                        {isGiven ? "I lent" : "I borrowed"}
                      </span>
                      {loan.settled ? (
                        <span className="rounded-full bg-surface-container-low px-2 py-0.5 text-[11px] font-medium text-on-surface-variant">
                          Settled
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 font-semibold text-on-surface">
                      {loan.personName}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {new Date(loan.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {loan.note ? ` • ${loan.note}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">
                      {formatMoney(loan.amount)}
                    </p>
                    {!loan.settled ? (
                      <p className="text-xs text-on-surface-variant">
                        Left: {formatMoney(loan.remaining)}
                      </p>
                    ) : null}
                  </div>
                </div>

                {!loan.settled ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() =>
                        updateLoan(loan.id, {
                          repaidAmount: loan.amount,
                          settled: true,
                        })
                      }
                      className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-on-secondary disabled:opacity-60"
                    >
                      Mark fully repaid
                    </button>
                    <RepaidButton
                      loan={loan}
                      disabled={isUpdating}
                      onSave={(repaidAmount) =>
                        updateLoan(loan.id, { repaidAmount })
                      }
                    />
                  </div>
                ) : null}

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => deleteLoan(loan)}
                    className="text-xs font-medium text-error disabled:opacity-60"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RepaidButton({
  loan,
  disabled,
  onSave,
}: {
  loan: LoanItem;
  disabled: boolean;
  onSave: (repaidAmount: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(String(loan.repaidAmount));

  if (!open) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="rounded-lg border border-outline-variant/40 px-3 py-1.5 text-xs font-medium disabled:opacity-60"
      >
        Update repaid ({loan.repaidAmount.toLocaleString("en-PK")})
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min="0"
        max={loan.amount}
        step="1"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="w-24 rounded-lg border border-outline-variant/40 px-2 py-1.5 text-xs"
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          onSave(Number(value));
          setOpen(false);
        }}
        className="rounded-lg bg-primary px-2 py-1.5 text-xs font-medium text-on-primary disabled:opacity-60"
      >
        Save
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-xs text-on-surface-variant"
      >
        Cancel
      </button>
    </div>
  );
}
