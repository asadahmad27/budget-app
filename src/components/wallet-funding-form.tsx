"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { FundEntriesList } from "@/components/fund-entries-list";
import { LogFundsForm } from "@/components/log-funds-form";
import { formatMoney } from "@/lib/format";

type FundEntry = {
  id: string;
  amount: number;
  note: string | null;
  date: Date | string;
};

export function WalletFundingForm({
  walletId,
  walletName,
  year,
  month,
  openingBalance,
  addedAmount,
  fundEntries = [],
}: {
  walletId: string;
  walletName: string;
  year: number;
  month: number;
  openingBalance: number;
  addedAmount: number;
  fundEntries?: FundEntry[];
}) {
  const router = useRouter();
  const returnTo = `/wallets?wallet=${walletId}&year=${year}&month=${month}`;
  const [editingRollover, setEditingRollover] = useState(false);
  const [rolloverLoading, setRolloverLoading] = useState(false);
  const [rolloverError, setRolloverError] = useState<string | null>(null);
  const [rolloverSaved, setRolloverSaved] = useState(false);

  async function saveOpeningBalance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRolloverLoading(true);
    setRolloverError(null);
    setRolloverSaved(false);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/wallets/funding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletId,
        year,
        month,
        openingBalance: Number(formData.get("openingBalance")),
        addedAmount,
      }),
    });

    setRolloverLoading(false);

    if (!response.ok) {
      const data = await response.json();
      setRolloverError(data.error ?? "Unable to update rollover balance");
      return;
    }

    setRolloverSaved(true);
    setEditingRollover(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <section className="space-y-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-primary">
              Rollover balance
            </h3>
            <p className="mt-1 text-sm text-on-surface-variant">
              Opening balance for {walletName} this month — leftover cash carried
              from last month or a manual starting amount.
            </p>
          </div>
          {!editingRollover ? (
            <button
              type="button"
              onClick={() => {
                setEditingRollover(true);
                setRolloverSaved(false);
                setRolloverError(null);
              }}
              className="rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-medium text-primary"
            >
              Edit
            </button>
          ) : null}
        </div>

        {!editingRollover ? (
          <div className="rounded-lg bg-surface-container-low p-4">
            <p className="text-sm text-on-surface-variant">Current rollover</p>
            <p className="mt-1 text-2xl font-semibold text-primary">
              {formatMoney(openingBalance)}
            </p>
            {rolloverSaved ? (
              <p className="mt-2 text-sm text-secondary">Rollover balance saved.</p>
            ) : null}
          </div>
        ) : (
          <form onSubmit={saveOpeningBalance} className="space-y-4">
            <div>
              <label
                className="mb-2 block text-sm font-medium"
                htmlFor="openingBalance"
              >
                Opening balance (incl. rollover)
              </label>
              <input
                id="openingBalance"
                name="openingBalance"
                type="number"
                min="0"
                step="1"
                key={openingBalance}
                defaultValue={openingBalance}
                autoFocus
                className="w-full rounded-lg border border-outline-variant/40 bg-white px-3 py-2 text-sm"
              />
            </div>

            {rolloverError ? (
              <p className="text-sm text-error">{rolloverError}</p>
            ) : null}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingRollover(false);
                  setRolloverError(null);
                }}
                disabled={rolloverLoading}
                className="rounded-lg border border-outline-variant px-4 py-2 text-sm disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={rolloverLoading}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary disabled:opacity-60"
              >
                {rolloverLoading ? "Saving..." : "Save rollover"}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="space-y-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6">
        <div>
          <h3 className="text-lg font-semibold text-primary">Add funds</h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            Log money received into {walletName}. You can edit or delete each
            entry below.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 rounded-lg bg-surface-container-low p-4 text-sm">
          <div>
            <p className="text-on-surface-variant">Opening (incl. rollover)</p>
            <p className="font-semibold">{formatMoney(openingBalance)}</p>
          </div>
          <div>
            <p className="text-on-surface-variant">Added this month</p>
            <p className="font-semibold text-secondary">
              {formatMoney(addedAmount)}
            </p>
          </div>
        </div>

        <FundEntriesList entries={fundEntries} />

        <LogFundsForm
          year={year}
          month={month}
          wallets={[{ id: walletId, name: walletName, color: "#1a2b48" }]}
          initialWalletId={walletId}
          returnTo={returnTo}
          currentAdded={addedAmount}
          embedded
        />
      </section>
    </div>
  );
}
