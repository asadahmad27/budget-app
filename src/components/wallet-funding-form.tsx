"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function WalletFundingForm({
  walletId,
  year,
  month,
  openingBalance,
  addedAmount,
}: {
  walletId: string;
  year: number;
  month: number;
  openingBalance: number;
  addedAmount: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/wallets/funding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletId,
        year,
        month,
        openingBalance: Number(formData.get("openingBalance")),
        addedAmount: Number(formData.get("addedAmount")),
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json();
      setMessage(data.error ?? "Unable to update wallet funding");
      return;
    }

    setMessage("Wallet funding updated.");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6"
    >
      <h3 className="text-lg font-semibold text-primary">Monthly Wallet Funding</h3>
      <p className="mt-1 text-sm text-on-surface-variant">
        Opening balance includes rollover from the previous month.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium" htmlFor="openingBalance">
            Opening balance
          </label>
          <input
            id="openingBalance"
            name="openingBalance"
            type="number"
            min="0"
            step="1"
            defaultValue={openingBalance}
            className="w-full rounded-lg border border-outline-variant px-4 py-3"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium" htmlFor="addedAmount">
            Added this month
          </label>
          <input
            id="addedAmount"
            name="addedAmount"
            type="number"
            min="0"
            step="1"
            defaultValue={addedAmount}
            className="w-full rounded-lg border border-outline-variant px-4 py-3"
          />
        </div>
      </div>

      {message ? <p className="mt-3 text-sm text-secondary">{message}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-4 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-on-primary disabled:opacity-60"
      >
        {loading ? "Saving..." : "Save funding"}
      </button>
    </form>
  );
}
