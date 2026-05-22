"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { EditTransactionForm } from "@/components/edit-transaction-form";
import {
  TransactionFiltersBar,
  useTransactionFilters,
} from "@/components/transaction-filters";
import { formatMoney } from "@/lib/format";

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

type TransactionItem = {
  id: string;
  amount: number;
  description: string | null;
  date: Date | string;
  walletId: string;
  categoryId: string | null;
  walletName: string;
  categoryName: string | null;
};

function transactionLabel(transaction: TransactionItem) {
  return transaction.categoryName ?? transaction.description ?? "General expense";
}

export function TransactionList({
  transactions,
  wallets,
  categories,
}: {
  transactions: TransactionItem[];
  wallets: WalletOption[];
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    walletId,
    categoryId,
    date,
    categoryOptions,
    filteredTransactions,
    hasActiveFilters,
    setWalletId,
    setCategoryId,
    setDate,
    clearFilters,
  } = useTransactionFilters(transactions, wallets, categories);

  async function handleDelete(transaction: TransactionItem) {
    const confirmed = window.confirm(
      `Delete ${transactionLabel(transaction)} (${formatMoney(transaction.amount)})?`,
    );

    if (!confirmed) return;

    setDeletingId(transaction.id);
    setError(null);

    const response = await fetch(`/api/transactions/${transaction.id}`, {
      method: "DELETE",
    });

    setDeletingId(null);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Unable to delete transaction");
      return;
    }

    if (editingId === transaction.id) {
      setEditingId(null);
    }

    router.refresh();
  }

  function handleEditSaved() {
    setEditingId(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <TransactionFiltersBar
        walletId={walletId}
        categoryId={categoryId}
        date={date}
        wallets={wallets}
        categoryOptions={categoryOptions}
        hasActiveFilters={hasActiveFilters}
        onWalletChange={setWalletId}
        onCategoryChange={setCategoryId}
        onDateChange={setDate}
        onClear={clearFilters}
      />

      {error ? <p className="text-sm text-error">{error}</p> : null}

      {transactions.length === 0 ? (
        <div className="rounded-lg bg-surface-container-low p-4 text-sm text-on-surface-variant">
          No transactions yet. Tap + to log spending.
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="rounded-lg bg-surface-container-low p-4 text-sm text-on-surface-variant">
          No transactions match your filters.
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTransactions.map((transaction) => {
            const transactionDate =
              typeof transaction.date === "string"
                ? new Date(transaction.date)
                : transaction.date;
            const isEditing = editingId === transaction.id;

            return (
              <div
                key={transaction.id}
                className="rounded-lg bg-surface-container-low p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white">
                      <span className="material-symbols-outlined text-error">
                        shopping_cart
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {transactionLabel(transaction)}
                      </p>
                      <p className="truncate text-xs text-on-surface-variant">
                        {transactionDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        • {transaction.walletName}
                        {transaction.categoryName && transaction.description
                          ? ` • ${transaction.description}`
                          : ""}
                        {!transaction.categoryName ? " • General expense" : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <p className="font-semibold text-error">
                      -{formatMoney(transaction.amount)}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setEditingId(isEditing ? null : transaction.id);
                      }}
                      disabled={deletingId === transaction.id}
                      className="rounded-full p-2 text-on-surface-variant hover:bg-white hover:text-primary disabled:opacity-60"
                      aria-label={`Edit ${transactionLabel(transaction)} transaction`}
                    >
                      <span className="material-symbols-outlined text-xl">
                        {isEditing ? "close" : "edit"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(transaction)}
                      disabled={deletingId === transaction.id}
                      className="rounded-full p-2 text-on-surface-variant hover:bg-white hover:text-error disabled:opacity-60"
                      aria-label={`Delete ${transactionLabel(transaction)} transaction`}
                    >
                      <span className="material-symbols-outlined text-xl">
                        {deletingId === transaction.id
                          ? "hourglass_empty"
                          : "delete"}
                      </span>
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <EditTransactionForm
                    transaction={transaction}
                    wallets={wallets}
                    categories={categories}
                    onCancel={() => setEditingId(null)}
                    onSaved={handleEditSaved}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
