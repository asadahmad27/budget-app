"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { resolveActivePeriod } from "@/lib/dashboard-period";
import { formatMoney } from "@/lib/format";

type WalletOption = {
  id: string;
  name: string;
  color: string;
};

export function LogFundsForm({
  year,
  month,
  wallets,
  initialWalletId,
  returnTo,
  currentAdded,
  embedded = false,
}: {
  year: number;
  month: number;
  wallets: WalletOption[];
  initialWalletId?: string;
  returnTo?: string;
  currentAdded?: number;
  embedded?: boolean;
}) {
  const router = useRouter();
  const defaultWalletId =
    initialWalletId && wallets.some((wallet) => wallet.id === initialWalletId)
      ? initialWalletId
      : (wallets[0]?.id ?? "");
  const [walletId, setWalletId] = useState(defaultWalletId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showWalletPicker = wallets.length > 1 && !initialWalletId;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const note = String(formData.get("note") ?? "").trim();

    const activePeriod = resolveActivePeriod({ year, month });
    const response = await fetch("/api/wallets/add-funds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        year: activePeriod.year,
        month: activePeriod.month,
        walletId,
        amount: Number(formData.get("amount")),
        note: note || undefined,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Unable to add funds");
      return;
    }

    router.push(returnTo ?? `/dashboard?year=${year}&month=${month}`);
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className={
        embedded
          ? "space-y-4"
          : "mx-auto max-w-2xl rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-md"
      }
    >
      <div className={embedded ? "" : "text-center"}>
        <label className="mb-2 block text-sm text-on-surface-variant" htmlFor="amount">
          Amount received (PKR)
        </label>
        <div
          className={`inline-flex items-center border-b-2 border-outline-variant focus-within:border-secondary ${
            embedded ? "w-full rounded-lg border px-4 py-3" : ""
          }`}
        >
          {!embedded ? (
            <span className="pr-2 text-2xl font-semibold text-secondary">₨</span>
          ) : null}
          <input
            id="amount"
            name="amount"
            type="number"
            min="1"
            step="1"
            required
            placeholder="0"
            className={
              embedded
                ? "w-full border-none bg-transparent text-sm outline-none"
                : "w-48 border-none bg-transparent text-center text-2xl font-semibold text-secondary outline-none"
            }
          />
        </div>
      </div>

      {showWalletPicker ? (
        <div className="mt-8">
          <p className="mb-3 text-sm font-medium">Wallet</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {wallets.map((wallet) => (
              <label
                key={wallet.id}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                  walletId === wallet.id
                    ? "border-secondary bg-secondary-container"
                    : "border-outline-variant/40"
                }`}
              >
                <input
                  type="radio"
                  name="wallet"
                  value={wallet.id}
                  checked={walletId === wallet.id}
                  onChange={() => setWalletId(wallet.id)}
                  className="sr-only"
                />
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: wallet.color }}
                  />
                  <span className="font-medium">{wallet.name}</span>
                </div>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      {currentAdded !== undefined ? (
        <p className="mt-6 text-center text-sm text-on-surface-variant">
          Already added this month: {formatMoney(currentAdded)}
        </p>
      ) : null}

      <div className="mt-6">
        <label className="mb-2 block text-sm font-medium" htmlFor="note">
          Note (optional)
        </label>
        <input
          id="note"
          name="note"
          type="text"
          placeholder="e.g. Salary, freelance payment, transfer"
          className="w-full rounded-lg border border-outline-variant px-4 py-3"
        />
      </div>

      {error ? <p className="mt-4 text-sm text-error">{error}</p> : null}

      {embedded ? (
        <button
          type="submit"
          disabled={loading || !walletId}
          className="w-full rounded-lg bg-secondary px-4 py-3 text-sm font-medium text-on-secondary disabled:opacity-60"
        >
          {loading ? "Saving..." : "Add funds"}
        </button>
      ) : (
        <div className="mt-8 flex gap-3">
          <Link
            href={returnTo ?? `/dashboard?year=${year}&month=${month}`}
            className="flex-1 rounded-lg border border-outline-variant px-4 py-3 text-center text-sm font-medium"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || !walletId}
            className="flex-1 rounded-lg bg-secondary px-4 py-3 text-sm font-medium text-on-secondary disabled:opacity-60"
          >
            {loading ? "Saving..." : "Add funds"}
          </button>
        </div>
      )}
    </form>
  );
}
