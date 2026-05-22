"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  PAKISTANI_WALLET_CATALOG,
  WALLET_TYPE_LABELS,
  type WalletProvider,
  type WalletType,
} from "@/lib/wallet-catalog";

type CatalogItem = WalletProvider & {
  added: boolean;
  hidden: boolean;
  walletId?: string;
};

export function WalletCatalogPicker({
  catalog,
  year,
  month,
}: {
  catalog: CatalogItem[];
  year: number;
  month: number;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loadingKey, setLoadingKey] = useState<string | "all" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return catalog;
    return catalog.filter((item) =>
      item.name.toLowerCase().includes(normalized),
    );
  }, [catalog, query]);

  const grouped = useMemo(() => {
    const groups: Record<WalletType, CatalogItem[]> = {
      "mobile-wallet": [],
      bank: [],
      fintech: [],
    };

    for (const item of filtered) {
      groups[item.type].push(item);
    }

    return groups;
  }, [filtered]);

  async function addWallet(providerKey: string) {
    setLoadingKey(providerKey);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/wallets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ providerKey }),
    });

    setLoadingKey(null);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Unable to add wallet");
      return;
    }

    setMessage("Wallet added.");
    router.push(`/wallets?year=${year}&month=${month}`);
    router.refresh();
  }

  async function addAllMissing() {
    setLoadingKey("all");
    setError(null);
    setMessage(null);

    const response = await fetch("/api/wallets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addAllMissing: true }),
    });

    setLoadingKey(null);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Unable to add wallets");
      return;
    }

    const data = await response.json();
    setMessage(`Added ${data.addedCount} wallet(s).`);
    router.refresh();
  }

  async function reactivateWallet(walletId: string) {
    setLoadingKey(walletId);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/wallets/${walletId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reactivate" }),
    });

    setLoadingKey(null);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Unable to restore wallet");
      return;
    }

    setMessage("Wallet restored.");
    router.push(`/wallets?year=${year}&month=${month}`);
    router.refresh();
  }

  const missingCount = catalog.filter((item) => !item.added && !item.hidden).length;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6">
        <h2 className="text-lg font-semibold text-primary">
          Pakistani wallets & banks
        </h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          Add mobile wallets like JazzCash and Easypaisa, or banks like HBL,
          UBL, and Meezan. {PAKISTANI_WALLET_CATALOG.length} providers available.
        </p>

        <div className="mt-4 flex flex-col gap-3 md:flex-row">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search JazzCash, HBL, NayaPay..."
            className="flex-1 rounded-lg border border-outline-variant px-4 py-3"
          />
          {missingCount > 0 ? (
            <button
              type="button"
              disabled={loadingKey !== null}
              onClick={addAllMissing}
              className="rounded-lg bg-secondary px-4 py-3 text-sm font-medium text-on-secondary disabled:opacity-60"
            >
              {loadingKey === "all"
                ? "Adding..."
                : `Add all missing (${missingCount})`}
            </button>
          ) : null}
        </div>

        {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}
        {message ? <p className="mt-3 text-sm text-secondary">{message}</p> : null}
      </div>

      {(Object.keys(grouped) as WalletType[]).map((type) => {
        const items = grouped[type];
        if (items.length === 0) return null;

        return (
          <section key={type} className="space-y-3">
            <h3 className="text-base font-semibold text-primary">
              {WALLET_TYPE_LABELS[type]}
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {items.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-on-surface-variant">
                        {WALLET_TYPE_LABELS[item.type]}
                      </p>
                    </div>
                  </div>

                  {item.added ? (
                    <span className="rounded-full bg-secondary-container px-3 py-1 text-xs font-medium text-on-secondary-container">
                      Active
                    </span>
                  ) : item.hidden && item.walletId ? (
                    <button
                      type="button"
                      disabled={loadingKey !== null}
                      onClick={() => reactivateWallet(item.walletId!)}
                      className="rounded-lg border border-primary px-3 py-2 text-sm font-medium text-primary disabled:opacity-60"
                    >
                      {loadingKey === item.walletId ? "Restoring..." : "Restore"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={loadingKey !== null}
                      onClick={() => addWallet(item.key)}
                      className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-on-primary disabled:opacity-60"
                    >
                      {loadingKey === item.key ? "Adding..." : "Add"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
