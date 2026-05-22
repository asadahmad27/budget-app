"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type WalletOption = {
  id: string;
  name: string;
  color: string;
};

type CategoryOption = {
  id: string;
  name: string;
  walletId: string;
};

type ExpenseType = "general" | "category";

type TransactionItem = {
  id: string;
  amount: number;
  description: string | null;
  walletId: string;
  categoryId: string | null;
};

export function EditTransactionForm({
  transaction,
  wallets,
  categories,
  onCancel,
  onSaved,
}: {
  transaction: TransactionItem;
  wallets: WalletOption[];
  categories: CategoryOption[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [walletId, setWalletId] = useState(transaction.walletId);
  const [expenseType, setExpenseType] = useState<ExpenseType>(
    transaction.categoryId ? "category" : "general",
  );
  const [categoryId, setCategoryId] = useState(transaction.categoryId ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.walletId === walletId),
    [categories, walletId],
  );

  useEffect(() => {
    if (expenseType !== "category") return;

    if (filteredCategories.length === 0) {
      setExpenseType("general");
      setCategoryId("");
      return;
    }

    if (!filteredCategories.some((category) => category.id === categoryId)) {
      setCategoryId(filteredCategories[0].id);
    }
  }, [filteredCategories, categoryId, expenseType]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const description = String(formData.get("description") ?? "").trim();

    const response = await fetch(`/api/transactions/${transaction.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletId,
        categoryId: expenseType === "category" ? categoryId : undefined,
        amount: Number(formData.get("amount")),
        description: description || undefined,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Unable to update transaction");
      return;
    }

    onSaved();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-3 space-y-3 rounded-lg border border-outline-variant bg-white p-4"
    >
      {error ? <p className="text-sm text-error">{error}</p> : null}

      <div>
        <label className="mb-1 block text-xs font-medium text-on-surface-variant">
          Wallet
        </label>
        <select
          value={walletId}
          onChange={(event) => setWalletId(event.target.value)}
          className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm"
          required
        >
          {wallets.map((wallet) => (
            <option key={wallet.id} value={wallet.id}>
              {wallet.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-on-surface-variant">
          Type
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setExpenseType("general")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
              expenseType === "general"
                ? "bg-primary text-on-primary"
                : "bg-surface-container-low text-on-surface-variant"
            }`}
          >
            General expense
          </button>
          <button
            type="button"
            onClick={() => setExpenseType("category")}
            disabled={filteredCategories.length === 0}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50 ${
              expenseType === "category"
                ? "bg-primary text-on-primary"
                : "bg-surface-container-low text-on-surface-variant"
            }`}
          >
            Budget category
          </button>
        </div>
      </div>

      {expenseType === "category" ? (
        <div>
          <label className="mb-1 block text-xs font-medium text-on-surface-variant">
            Category
          </label>
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm"
            required
          >
            {filteredCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div>
          <label className="mb-1 block text-xs font-medium text-on-surface-variant">
            What did you spend on?
          </label>
          <input
            name="description"
            type="text"
            defaultValue={transaction.description ?? ""}
            placeholder="e.g. Groceries, fuel"
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm"
            required
          />
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-on-surface-variant">
          Amount (PKR)
        </label>
        <input
          name="amount"
          type="number"
          min="1"
          step="1"
          defaultValue={transaction.amount}
          className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm"
          required
        />
      </div>

      {expenseType === "category" ? (
        <div>
          <label className="mb-1 block text-xs font-medium text-on-surface-variant">
            Note (optional)
          </label>
          <input
            name="description"
            type="text"
            defaultValue={transaction.description ?? ""}
            placeholder="Optional note"
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm"
          />
        </div>
      ) : null}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 rounded-lg bg-surface-container-low px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary disabled:opacity-60"
        >
          {loading ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
