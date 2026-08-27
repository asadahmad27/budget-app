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
  variant = "button",
}: {
  year: number;
  month: number;
  walletId?: string;
  walletName?: string;
  amount?: number;
  variant?: "button" | "card";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scopeLabel = walletName
    ? walletName
    : "every wallet this month";
  const amountLabel =
    amount !== undefined && amount > 0 ? ` (${formatMoney(amount)})` : "";

  async function handleClear() {
    const confirmed = window.confirm(
      `Set previous/rollover balance to 0 for ${scopeLabel}${amountLabel}?\n\nFunds added this month will stay.`,
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
        ...(walletId ? { walletId } : {}),
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

  const button = (
    <button
      type="button"
      onClick={handleClear}
      disabled={loading}
      className={
        variant === "card"
          ? "mt-4 rounded-lg border border-error px-4 py-2 text-sm font-medium text-error disabled:opacity-60"
          : "rounded-lg border border-error/40 px-3 py-1.5 text-xs font-medium text-error disabled:opacity-60"
      }
    >
      {loading ? "Clearing…" : variant === "card" ? "Set previous balance to 0" : "Set to 0"}
    </button>
  );

  if (variant === "card") {
    return (
      <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6">
        <h3 className="text-lg font-semibold text-primary">
          Previous balance
        </h3>
        <p className="mt-1 text-sm text-on-surface-variant">
          Last month&apos;s leftover is included as this month&apos;s opening
          {amount !== undefined ? ` (${formatMoney(amount)})` : ""}. Clear it
          to start this month at 0. Money added this month is kept.
        </p>
        {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}
        {button}
      </section>
    );
  }

  return (
    <div>
      {button}
      {error ? <p className="mt-2 text-xs text-error">{error}</p> : null}
    </div>
  );
}
