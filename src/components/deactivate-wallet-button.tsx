"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatMoney } from "@/lib/format";

export function DeactivateWalletButton({
  walletId,
  walletName,
  balance,
  year,
  month,
}: {
  walletId: string;
  walletName: string;
  balance: number;
  year: number;
  month: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canHide = balance === 0;

  async function handleHide() {
    const confirmed = window.confirm(
      `Hide ${walletName}? Past transaction logs will be kept.`,
    );

    if (!confirmed) return;

    setLoading(true);
    setError(null);

    const response = await fetch(`/api/wallets/${walletId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deactivate", year, month }),
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Unable to hide wallet");
      return;
    }

    router.push(`/wallets?year=${year}&month=${month}`);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6">
      <h3 className="text-lg font-semibold text-primary">Hide wallet</h3>
      <p className="mt-2 text-sm text-on-surface-variant">
        Hiding removes {walletName} from your active wallets. Transaction logs
        are kept. The balance must be {formatMoney(0)} for this month.
      </p>

      {!canHide ? (
        <p className="mt-3 text-sm text-error">
          Current balance is {formatMoney(balance)}. Bring it to zero before
          hiding this wallet.
        </p>
      ) : null}

      {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}

      <button
        type="button"
        onClick={handleHide}
        disabled={!canHide || loading}
        className="mt-4 rounded-lg border border-error px-4 py-2 text-sm font-medium text-error disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Hiding..." : "Hide wallet"}
      </button>
    </div>
  );
}
