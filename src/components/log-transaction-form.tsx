"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AddCategoryForm } from "@/components/add-category-form";

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

export function LogTransactionForm({
  year,
  month,
  wallets,
  categories: initialCategories,
  initialWalletId,
  initialCategoryId,
  returnTo,
}: {
  year: number;
  month: number;
  wallets: WalletOption[];
  categories: CategoryOption[];
  initialWalletId?: string;
  initialCategoryId?: string;
  returnTo?: string;
}) {
  const router = useRouter();
  const defaultWalletId =
    initialWalletId && wallets.some((wallet) => wallet.id === initialWalletId)
      ? initialWalletId
      : (wallets[0]?.id ?? "");
  const [walletId, setWalletId] = useState(defaultWalletId);
  const [categories, setCategories] = useState(initialCategories);
  const [expenseType, setExpenseType] = useState<ExpenseType>(
    initialCategoryId ? "category" : "general",
  );
  const [categoryId, setCategoryId] = useState(initialCategoryId ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.walletId === walletId),
    [categories, walletId],
  );

  useEffect(() => {
    if (
      expenseType === "category" &&
      filteredCategories.length > 0 &&
      !filteredCategories.some((category) => category.id === categoryId)
    ) {
      setCategoryId(filteredCategories[0].id);
    }
  }, [filteredCategories, categoryId, expenseType]);

  function handleCategoryCreated(category: CategoryOption) {
    setCategories((current) => [...current, category]);
    setCategoryId(category.id);
    setExpenseType("category");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const description = String(formData.get("description") ?? "").trim();

    const response = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        year,
        month,
        walletId,
        categoryId: expenseType === "category" ? categoryId : undefined,
        amount: Number(formData.get("amount")),
        description: description || undefined,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Unable to log transaction");
      return;
    }

    router.push(returnTo ?? `/dashboard?year=${year}&month=${month}`);
    router.refresh();
  }

  const canSubmit =
    walletId &&
    (expenseType === "general" ||
      (expenseType === "category" && categoryId));

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-2xl rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-md"
    >
      <div className="text-center">
        <label className="mb-2 block text-sm text-on-surface-variant" htmlFor="amount">
          Amount (PKR)
        </label>
        <div className="inline-flex items-center border-b-2 border-outline-variant focus-within:border-primary">
          <span className="pr-2 text-2xl font-semibold text-primary">₨</span>
          <input
            id="amount"
            name="amount"
            type="number"
            min="1"
            step="1"
            required
            placeholder="0"
            className="w-48 border-none bg-transparent text-center text-2xl font-semibold text-primary outline-none"
          />
        </div>
      </div>

      <div className="mt-8">
        <p className="mb-3 text-sm font-medium">Wallet</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {wallets.map((wallet) => (
            <label
              key={wallet.id}
              className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                walletId === wallet.id
                  ? "border-primary bg-surface-container"
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

      <div className="mt-8">
        <p className="mb-3 text-sm font-medium">Expense type</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label
            className={`cursor-pointer rounded-xl border-2 p-4 ${
              expenseType === "general"
                ? "border-primary bg-surface-container"
                : "border-outline-variant/40"
            }`}
          >
            <input
              type="radio"
              name="expenseType"
              checked={expenseType === "general"}
              onChange={() => setExpenseType("general")}
              className="sr-only"
            />
            <p className="font-medium">General expense</p>
            <p className="mt-1 text-xs text-on-surface-variant">
              Ice cream, UPS water, snacks — not tied to a budget category
            </p>
          </label>
          <label
            className={`cursor-pointer rounded-xl border-2 p-4 ${
              expenseType === "category"
                ? "border-primary bg-surface-container"
                : "border-outline-variant/40"
            }`}
          >
            <input
              type="radio"
              name="expenseType"
              checked={expenseType === "category"}
              onChange={() => setExpenseType("category")}
              className="sr-only"
            />
            <p className="font-medium">Budget category</p>
            <p className="mt-1 text-xs text-on-surface-variant">
              Rent, groceries, petrol — counts against a category budget
            </p>
          </label>
        </div>
      </div>

      {expenseType === "category" ? (
        <div className="mt-8">
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium" htmlFor="categoryId">
              Category
            </label>
            {walletId ? (
              <AddCategoryForm
                walletId={walletId}
                year={year}
                month={month}
                compact
                onCreated={handleCategoryCreated}
              />
            ) : null}
          </div>
          {filteredCategories.length > 0 ? (
            <select
              id="categoryId"
              name="categoryId"
              required
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="w-full rounded-lg border border-outline-variant px-4 py-3"
            >
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="rounded-lg bg-surface-container-low p-4 text-sm text-on-surface-variant">
              No categories for this wallet yet. Add one above, or use general
              expense instead.
            </p>
          )}
        </div>
      ) : null}

      <div className="mt-6">
        <label className="mb-2 block text-sm font-medium" htmlFor="description">
          {expenseType === "general" ? "What did you spend on?" : "Note (optional)"}
        </label>
        <input
          id="description"
          name="description"
          type="text"
          required={expenseType === "general"}
          placeholder={
            expenseType === "general"
              ? "e.g. Ice cream, UPS water, snacks"
              : "Partial payment, groceries, etc."
          }
          className="w-full rounded-lg border border-outline-variant px-4 py-3"
        />
      </div>

      {error ? <p className="mt-4 text-sm text-error">{error}</p> : null}

      <div className="mt-8 flex gap-3">
        <Link
          href={returnTo ?? `/dashboard?year=${year}&month=${month}`}
          className="flex-1 rounded-lg border border-outline-variant px-4 py-3 text-center text-sm font-medium"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={loading || !canSubmit}
          className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-on-primary disabled:opacity-60"
        >
          {loading ? "Saving..." : "Log spending"}
        </button>
      </div>
    </form>
  );
}
