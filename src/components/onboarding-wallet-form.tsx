"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import {
  PAKISTANI_WALLET_CATALOG,
  WALLET_TYPE_LABELS,
  type WalletProvider,
  type WalletType,
} from "@/lib/wallet-catalog";

const DEFAULT_SELECTED = new Set(["jazzcash", "nayapay", "easypaisa", "cash"]);

type WalletSelection = {
  selected: boolean;
  openingBalance: string;
};

function defaultSelections() {
  const selections: Record<string, WalletSelection> = {};
  for (const provider of PAKISTANI_WALLET_CATALOG) {
    selections[provider.key] = {
      selected: DEFAULT_SELECTED.has(provider.key),
      openingBalance: String(provider.defaultOpening ?? 0),
    };
  }
  return selections;
}

export function OnboardingWalletForm() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selections, setSelections] = useState(defaultSelections);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return PAKISTANI_WALLET_CATALOG;
    return PAKISTANI_WALLET_CATALOG.filter((provider) =>
      provider.name.toLowerCase().includes(normalized),
    );
  }, [query]);

  const grouped = useMemo(() => {
    const groups: Record<WalletType, WalletProvider[]> = {
      "mobile-wallet": [],
      bank: [],
      fintech: [],
    };

    for (const provider of filtered) {
      groups[provider.type].push(provider);
    }

    return groups;
  }, [filtered]);

  const selectedCount = useMemo(
    () =>
      Object.values(selections).filter((selection) => selection.selected)
        .length,
    [selections],
  );

  function toggleWallet(key: string, selected: boolean) {
    setSelections((current) => ({
      ...current,
      [key]: { ...current[key], selected },
    }));
  }

  function updateOpeningBalance(key: string, openingBalance: string) {
    setSelections((current) => ({
      ...current,
      [key]: { ...current[key], openingBalance },
    }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const wallets = PAKISTANI_WALLET_CATALOG.filter(
      (provider) => selections[provider.key]?.selected,
    ).map((provider) => ({
      providerKey: provider.key,
      openingBalance: Number(selections[provider.key]?.openingBalance ?? 0),
    }));

    if (wallets.length === 0) {
      setLoading(false);
      setError("Select at least one wallet to continue.");
      return;
    }

    for (const wallet of wallets) {
      if (!Number.isFinite(wallet.openingBalance) || wallet.openingBalance < 0) {
        setLoading(false);
        setError("Enter a valid opening amount for each selected wallet.");
        return;
      }
    }

    const response = await fetch("/api/onboarding/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallets }),
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Unable to complete setup");
      return;
    }

    router.push("/months");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6">
        <h2 className="text-lg font-semibold text-primary">
          Choose your wallets
        </h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          Select the mobile wallets and banks you use, then set how much you
          currently have in each one. You can add more wallets later.
        </p>

        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search JazzCash, HBL, NayaPay..."
          className="mt-4 w-full rounded-lg border border-outline-variant px-4 py-3"
        />

        <p className="mt-3 text-sm text-on-surface-variant">
          {selectedCount} wallet{selectedCount === 1 ? "" : "s"} selected
        </p>
      </div>

      {(Object.keys(grouped) as WalletType[]).map((type) => {
        const providers = grouped[type];
        if (providers.length === 0) return null;

        return (
          <section key={type} className="space-y-3">
            <h3 className="text-base font-semibold text-primary">
              {WALLET_TYPE_LABELS[type]}
            </h3>
            <div className="space-y-3">
              {providers.map((provider) => {
                const selection = selections[provider.key];
                const selected = selection?.selected ?? false;

                return (
                  <div
                    key={provider.key}
                    className={`rounded-xl border p-4 transition-colors ${
                      selected
                        ? "border-primary/40 bg-primary-container/20"
                        : "border-outline-variant/30 bg-surface-container-lowest"
                    }`}
                  >
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(event) =>
                          toggleWallet(provider.key, event.target.checked)
                        }
                        className="mt-1 h-4 w-4 rounded border-outline-variant text-primary"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span
                            className="h-4 w-4 rounded-full"
                            style={{ backgroundColor: provider.color }}
                          />
                          <p className="font-medium">{provider.name}</p>
                        </div>

                        {selected ? (
                          <div className="mt-3">
                            <label
                              className="mb-2 block text-sm font-medium"
                              htmlFor={`opening-${provider.key}`}
                            >
                              Opening amount (PKR)
                            </label>
                            <input
                              id={`opening-${provider.key}`}
                              type="number"
                              min={0}
                              step={1}
                              inputMode="numeric"
                              value={selection?.openingBalance ?? "0"}
                              onChange={(event) =>
                                updateOpeningBalance(
                                  provider.key,
                                  event.target.value,
                                )
                              }
                              className="w-full rounded-lg border border-outline-variant bg-white px-4 py-3 outline-none focus:border-primary md:max-w-xs"
                            />
                            <p className="mt-1 text-xs text-on-surface-variant">
                              Current balance or rollover from last month.
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {error ? <p className="text-sm text-error">{error}</p> : null}

      <button
        type="submit"
        disabled={loading || selectedCount === 0}
        className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-on-primary disabled:opacity-60"
      >
        {loading ? "Setting up..." : "Continue to budget"}
      </button>
    </form>
  );
}
