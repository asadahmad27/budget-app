"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatMoney } from "@/lib/format";

export function ClearPreviousBalanceButton({
  year,
  month,
  walletId,
  walletName,
  amount,
}: {
  year: number;
  month: number;
  walletId: string;
  walletName: string;
  amount: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClear() {
    const confirmed = window.confirm(
      `Set previous/rollover balance to 0 for ${walletName} (${formatMoney(amount)})?\n\nFunds added this month will stay.`,
    );
    if (!confirmed) return;

    setLoading(true);
    setError(null);

    const response = await fetch("/api/wallets/clear-opening", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        year,
        month,
        walletId,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Unable to clear previous balance");
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClear}
        disabled={loading}
        className="rounded-lg border border-error/40 px-3 py-1.5 text-xs font-medium text-error disabled:opacity-60"
      >
        {loading ? "Clearing…" : "Set to 0"}
      </button>
      {error ? <p className="mt-2 text-xs text-error">{error}</p> : null}
    </div>
  );
}
