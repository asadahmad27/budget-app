"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type WalletOption = {
  id: string;
  name: string;
  color: string;
};

export function AddGoalForm({ wallets }: { wallets: WalletOption[] }) {
  const router = useRouter();
  const [walletId, setWalletId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setLoading(true);
    setError(null);

    const formData = new FormData(form);
    const savedRaw = String(formData.get("savedAmount") ?? "").trim();

    const response = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(formData.get("name") ?? ""),
        note: String(formData.get("note") ?? "").trim() || undefined,
        projectedCost: Number(formData.get("projectedCost")),
        savedAmount: savedRaw ? Number(savedRaw) : 0,
        walletId: walletId || null,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Unable to add goal");
      return;
    }

    form.reset();
    setWalletId("");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6"
    >
      <h2 className="text-lg font-semibold text-primary">Add life goal</h2>
      <p className="mt-1 text-sm text-on-surface-variant">
        Long-term targets like a car, house, or Umrah — name it yourself, no
        fixed categories.
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium" htmlFor="goal-name">
            Goal name
          </label>
          <input
            id="goal-name"
            name="name"
            type="text"
            required
            placeholder="e.g. Car, House, Umrah"
            className="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium" htmlFor="goal-note">
            Notes
          </label>
          <textarea
            id="goal-note"
            name="note"
            rows={3}
            placeholder="Timeline, plan, reminders…"
            className="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              className="mb-2 block text-sm font-medium"
              htmlFor="projectedCost"
            >
              Projected cost (PKR)
            </label>
            <input
              id="projectedCost"
              name="projectedCost"
              type="number"
              min="1"
              step="1"
              required
              className="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label
              className="mb-2 block text-sm font-medium"
              htmlFor="savedAmount"
            >
              Saved so far (PKR)
            </label>
            <input
              id="savedAmount"
              name="savedAmount"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              className="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium" htmlFor="goal-wallet">
            Savings in wallet (optional)
          </label>
          <select
            id="goal-wallet"
            value={walletId}
            onChange={(event) => setWalletId(event.target.value)}
            className="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm"
          >
            <option value="">Not linked to a wallet</option>
            {wallets.map((wallet) => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-on-surface-variant">
            Which wallet or bank holds money you are setting aside for this goal.
          </p>
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary disabled:opacity-60"
      >
        {loading ? "Saving..." : "Add goal"}
      </button>
    </form>
  );
}
