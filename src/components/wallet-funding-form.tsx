"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { LogFundsForm } from "@/components/log-funds-form";
import { formatMoney } from "@/lib/format";

export function WalletFundingForm({
  walletId,
  walletName,
  year,
  month,
  openingBalance,
  addedAmount,
}: {
  walletId: string;
  walletName: string;
  year: number;
  month: number;
  openingBalance: number;
  addedAmount: number;
}) {
  const router = useRouter();
  const returnTo = `/wallets?wallet=${walletId}&year=${year}&month=${month}`;
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
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <section className="space-y-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6">
        <div>
          <h3 className="text-lg font-semibold text-primary">Rollover balance</h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            Set the opening balance for {walletName} this month — leftover cash
            carried from last month or a manual starting amount.
          </p>
        </div>

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
              onChange={() => setRolloverSaved(false)}
              className="w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-sm"
            />
          </div>

          {rolloverError ? (
            <p className="text-sm text-error">{rolloverError}</p>
          ) : null}
          {rolloverSaved ? (
            <p className="text-sm text-secondary">Rollover balance saved.</p>
          ) : null}

          <button
            type="submit"
            disabled={rolloverLoading}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary disabled:opacity-60"
          >
            {rolloverLoading ? "Saving..." : "Save rollover balance"}
          </button>
        </form>
      </section>

      <section className="space-y-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6">
        <div>
          <h3 className="text-lg font-semibold text-primary">Add funds</h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            Log money received into {walletName}. Each entry adds to this
            month&apos;s balance.
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
