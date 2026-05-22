"use client";

import { useMemo, useState } from "react";

type WalletOption = {
  id: string;
  name: string;
};

type CategoryOption = {
  id: string;
  name: string;
  walletId: string;
};

function isSameCalendarDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function useTransactionFilters<T extends {
  walletId: string;
  categoryId: string | null;
  date: Date | string;
}>(
  transactions: T[],
  wallets: WalletOption[],
  categories: CategoryOption[],
) {
  const [walletId, setWalletId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState("");

  const categoryOptions = useMemo(() => {
    const scoped = walletId
      ? categories.filter((category) => category.walletId === walletId)
      : categories;

    return scoped;
  }, [categories, walletId]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      if (walletId && transaction.walletId !== walletId) {
        return false;
      }

      if (categoryId === "general" && transaction.categoryId) {
        return false;
      }

      if (
        categoryId &&
        categoryId !== "general" &&
        transaction.categoryId !== categoryId
      ) {
        return false;
      }

      if (date) {
        const transactionDate =
          typeof transaction.date === "string"
            ? new Date(transaction.date)
            : transaction.date;
        const filterDate = new Date(`${date}T00:00:00`);

        if (!isSameCalendarDay(transactionDate, filterDate)) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, walletId, categoryId, date]);

  const hasActiveFilters = Boolean(walletId || categoryId || date);

  function clearFilters() {
    setWalletId("");
    setCategoryId("");
    setDate("");
  }

  function handleWalletChange(value: string) {
    setWalletId(value);
    if (
      categoryId &&
      categoryId !== "general" &&
      !categories.some(
        (category) =>
          category.id === categoryId &&
          (!value || category.walletId === value),
      )
    ) {
      setCategoryId("");
    }
  }

  return {
    walletId,
    categoryId,
    date,
    categoryOptions,
    filteredTransactions,
    hasActiveFilters,
    setWalletId: handleWalletChange,
    setCategoryId,
    setDate,
    clearFilters,
    wallets,
  };
}

export function TransactionFiltersBar({
  walletId,
  categoryId,
  date,
  wallets,
  categoryOptions,
  hasActiveFilters,
  onWalletChange,
  onCategoryChange,
  onDateChange,
  onClear,
}: {
  walletId: string;
  categoryId: string;
  date: string;
  wallets: WalletOption[];
  categoryOptions: CategoryOption[];
  hasActiveFilters: boolean;
  onWalletChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-3 rounded-lg bg-surface-container-lowest p-4 shadow-[0px_4px_12px_rgba(26,43,72,0.05)]">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label
            htmlFor="transaction-filter-wallet"
            className="mb-1 block text-xs font-medium text-on-surface-variant"
          >
            Wallet
          </label>
          <select
            id="transaction-filter-wallet"
            value={walletId}
            onChange={(event) => onWalletChange(event.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
          >
            <option value="">All wallets</option>
            {wallets.map((wallet) => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="transaction-filter-category"
            className="mb-1 block text-xs font-medium text-on-surface-variant"
          >
            Category
          </label>
          <select
            id="transaction-filter-category"
            value={categoryId}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
          >
            <option value="">All categories</option>
            <option value="general">General expense</option>
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="transaction-filter-date"
            className="mb-1 block text-xs font-medium text-on-surface-variant"
          >
            Date
          </label>
          <input
            id="transaction-filter-date"
            type="date"
            value={date}
            onChange={(event) => onDateChange(event.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
          />
        </div>
      </div>

      {hasActiveFilters ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-on-surface-variant">
            Showing filtered results for this month
          </p>
          <button
            type="button"
            onClick={onClear}
            className="text-sm font-medium text-secondary hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : null}
    </div>
  );
}
