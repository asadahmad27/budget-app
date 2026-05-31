"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { EditTransactionForm } from "@/components/edit-transaction-form";
import { MoveTransactionMonthForm } from "@/components/move-transaction-month-form";
import {
  TransactionFiltersBar,
  useTransactionFilters,
} from "@/components/transaction-filters";
import { formatMoney, formatMonthLabel } from "@/lib/format";

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

function getTransactionDate(transaction: TransactionItem) {
  return typeof transaction.date === "string"
    ? new Date(transaction.date)
    : transaction.date;
}

function groupTransactionsByBudgetMonth(
  transactions: TransactionItem[],
  budgetYear: number,
  budgetMonth: number,
  budgetLabel: string,
) {
  const sorted = [...transactions].sort(
    (a, b) => getTransactionDate(b).getTime() - getTransactionDate(a).getTime(),
  );

  return [
    {
      year: budgetYear,
      month: budgetMonth,
      label: budgetLabel,
      transactions: sorted,
    },
  ];
}

function groupTransactionsByMonth(transactions: TransactionItem[]) {
  const groups = new Map<string, TransactionItem[]>();

  for (const transaction of transactions) {
    const date = getTransactionDate(transaction);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    const existing = groups.get(key);
    if (existing) {
      existing.push(transaction);
    } else {
      groups.set(key, [transaction]);
    }
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a, undefined, { numeric: true }))
    .map(([key, items]) => {
      const [year, month] = key.split("-").map(Number);
      return {
        year,
        month,
        label: formatMonthLabel(year, month),
        transactions: items.sort(
          (a, b) =>
            getTransactionDate(b).getTime() - getTransactionDate(a).getTime(),
        ),
      };
    });
}

export function TransactionList({
  transactions,
  wallets,
  categories,
  budgetYear,
  budgetMonth,
  budgetLabel,
}: {
  transactions: TransactionItem[];
  wallets: WalletOption[];
  categories: CategoryOption[];
  budgetYear?: number;
  budgetMonth?: number;
  budgetLabel?: string;
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
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

  const transactionGroups = useMemo(() => {
    if (
      budgetYear !== undefined &&
      budgetMonth !== undefined &&
      budgetLabel
    ) {
      return groupTransactionsByBudgetMonth(
        filteredTransactions,
        budgetYear,
        budgetMonth,
        budgetLabel,
      );
    }

    return groupTransactionsByMonth(filteredTransactions);
  }, [filteredTransactions, budgetYear, budgetMonth, budgetLabel]);

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

  function handleMoved() {
    setMovingId(null);
    setEditingId(null);
    router.refresh();
  }

  function toggleMoving(transactionId: string) {
    setError(null);
    setEditingId(null);
    setMovingId((current) => (current === transactionId ? null : transactionId));
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
        <div className="space-y-6">
          {transactionGroups.map((group) => (
            <section key={`${group.year}-${group.month}`}>
              <h4 className="mb-3 text-sm font-semibold text-primary">
                {group.label}
              </h4>
              <div className="space-y-2">
                {group.transactions.map((transaction) => {
                  const transactionDate = getTransactionDate(transaction);
                  const isEditing = editingId === transaction.id;
                  const isMoving = movingId === transaction.id;
                  const isBusy = deletingId === transaction.id;

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
                          {budgetYear !== undefined && budgetMonth !== undefined ? (
                            <button
                              type="button"
                              onClick={() => toggleMoving(transaction.id)}
                              disabled={isBusy}
                              className="rounded-full p-2 text-on-surface-variant hover:bg-white hover:text-secondary disabled:opacity-60"
                              aria-label={`Move ${transactionLabel(transaction)} to another month`}
                            >
                              <span className="material-symbols-outlined text-xl">
                                {isMoving ? "close" : "swap_horiz"}
                              </span>
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => {
                              setError(null);
                              setEditingId(isEditing ? null : transaction.id);
                              setMovingId(null);
                            }}
                            disabled={isBusy}
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
                            disabled={isBusy}
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

                      {isMoving &&
                      budgetYear !== undefined &&
                      budgetMonth !== undefined ? (
                        <MoveTransactionMonthForm
                          transactionId={transaction.id}
                          fromYear={budgetYear}
                          fromMonth={budgetMonth}
                          onCancel={() => setMovingId(null)}
                          onMoved={handleMoved}
                        />
                      ) : null}

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
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
