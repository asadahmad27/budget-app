"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AddCategoryForm } from "@/components/add-category-form";
import { resolveActivePeriod } from "@/lib/dashboard-period";
import { formatDateInputValue, formatMoney } from "@/lib/format";
import type { LoanActivityAction, LoanItem } from "@/lib/loans";

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
type LogMode = "single" | "multiple";
type LoanTarget = "existing" | "new";

type SpendingEntry = {
  id: string;
  amount: string;
  walletId: string;
  expenseType: ExpenseType;
  categoryId: string;
  description: string;
};

function createEntryId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createSpendingEntry(
  walletId: string,
  expenseType: ExpenseType = "general",
): SpendingEntry {
  return {
    id: createEntryId(),
    amount: "",
    walletId,
    expenseType,
    categoryId: "",
    description: "",
  };
}

export function LogTransactionForm({
  year,
  month,
  wallets,
  categories: initialCategories,
  activeLoans = [],
  initialWalletId,
  initialCategoryId,
  returnTo,
}: {
  year: number;
  month: number;
  wallets: WalletOption[];
  categories: CategoryOption[];
  activeLoans?: LoanItem[];
  initialWalletId?: string;
  initialCategoryId?: string;
  returnTo?: string;
}) {
  const router = useRouter();
  const defaultWalletId =
    initialWalletId && wallets.some((wallet) => wallet.id === initialWalletId)
      ? initialWalletId
      : (wallets[0]?.id ?? "");
  const [logMode, setLogMode] = useState<LogMode>("single");
  const [walletId, setWalletId] = useState(defaultWalletId);
  const [categories, setCategories] = useState(initialCategories);
  const [expenseType, setExpenseType] = useState<ExpenseType>(
    initialCategoryId ? "category" : "general",
  );
  const [categoryId, setCategoryId] = useState(initialCategoryId ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sharedDate, setSharedDate] = useState(formatDateInputValue(new Date()));
  const defaultDate = formatDateInputValue(new Date());
  const [entries, setEntries] = useState<SpendingEntry[]>(() => [
    createSpendingEntry(defaultWalletId, initialCategoryId ? "category" : "general"),
    createSpendingEntry(defaultWalletId),
  ]);
  const [recordLoan, setRecordLoan] = useState(false);
  const [loanAction, setLoanAction] = useState<LoanActivityAction>("sent");
  const [loanTarget, setLoanTarget] = useState<LoanTarget>(
    activeLoans.length > 0 ? "existing" : "new",
  );
  const [loanId, setLoanId] = useState(activeLoans[0]?.id ?? "");
  const [personName, setPersonName] = useState("");

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

  function categoriesForWallet(targetWalletId: string) {
    return categories.filter((category) => category.walletId === targetWalletId);
  }

  function updateEntry(
    entryId: string,
    patch: Partial<Omit<SpendingEntry, "id">>,
  ) {
    setEntries((current) =>
      current.map((entry) => {
        if (entry.id !== entryId) return entry;

        const next = { ...entry, ...patch };
        if (patch.walletId && patch.walletId !== entry.walletId) {
          const walletCategories = categoriesForWallet(patch.walletId);
          next.categoryId = walletCategories[0]?.id ?? "";
        }
        return next;
      }),
    );
  }

  function addEntry() {
    setEntries((current) => [
      ...current,
      createSpendingEntry(current[current.length - 1]?.walletId ?? defaultWalletId),
    ]);
  }

  function removeEntry(entryId: string) {
    setEntries((current) =>
      current.length === 1 ? current : current.filter((entry) => entry.id !== entryId),
    );
  }

  async function onSubmitSingle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const description = String(formData.get("description") ?? "").trim();

    if (recordLoan) {
      if (loanTarget === "existing" && !loanId) {
        setLoading(false);
        setError("Choose an existing loan");
        return;
      }
      if (loanTarget === "new" && !personName.trim()) {
        setLoading(false);
        setError("Enter who the loan is with");
        return;
      }
    }

    const activePeriod = resolveActivePeriod({ year, month });
    const payload: Record<string, unknown> = {
      year: activePeriod.year,
      month: activePeriod.month,
      walletId,
      categoryId: expenseType === "category" ? categoryId : undefined,
      amount: Number(formData.get("amount")),
      description: description || undefined,
      date: String(formData.get("date") ?? defaultDate),
    };

    if (recordLoan) {
      payload.loan =
        loanTarget === "existing"
          ? { action: loanAction, loanId }
          : {
              action: loanAction,
              personName: personName.trim(),
              direction:
                loanAction === "sent"
                  ? ("given" as const)
                  : ("taken" as const),
            };
    }

    const response = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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

  async function onSubmitMultiple(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const payloadEntries = entries.map((entry, index) => {
      const amount = Number(entry.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error(`Entry ${index + 1}: enter a valid amount`);
      }
      if (!entry.walletId) {
        throw new Error(`Entry ${index + 1}: choose a wallet`);
      }
      if (entry.expenseType === "category" && !entry.categoryId) {
        throw new Error(`Entry ${index + 1}: choose a category`);
      }
      if (entry.expenseType === "general" && !entry.description.trim()) {
        throw new Error(`Entry ${index + 1}: add a description`);
      }

      return {
        walletId: entry.walletId,
        categoryId:
          entry.expenseType === "category" ? entry.categoryId : undefined,
        amount,
        description: entry.description.trim() || undefined,
      };
    });

    try {
      const activePeriod = resolveActivePeriod({ year, month });
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: activePeriod.year,
          month: activePeriod.month,
          date: sharedDate,
          entries: payloadEntries,
        }),
      });

      setLoading(false);

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Unable to log transactions");
        return;
      }

      router.push(returnTo ?? `/dashboard?year=${year}&month=${month}`);
      router.refresh();
    } catch (submitError) {
      setLoading(false);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to log transactions",
      );
    }
  }

  const canSubmitSingle =
    walletId &&
    (expenseType === "general" ||
      (expenseType === "category" && categoryId));

  const cancelHref = returnTo ?? `/dashboard?year=${year}&month=${month}`;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-low p-1">
        <button
          type="button"
          onClick={() => {
            setLogMode("single");
            setError(null);
          }}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            logMode === "single"
              ? "bg-primary text-on-primary"
              : "text-on-surface-variant"
          }`}
        >
          Single expense
        </button>
        <button
          type="button"
          onClick={() => {
            setLogMode("multiple");
            setError(null);
          }}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            logMode === "multiple"
              ? "bg-primary text-on-primary"
              : "text-on-surface-variant"
          }`}
        >
          Multiple (same date)
        </button>
      </div>

      {logMode === "single" ? (
        <form
          onSubmit={onSubmitSingle}
          className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-md"
        >
          <SingleExpenseFields
            wallets={wallets}
            walletId={walletId}
            setWalletId={setWalletId}
            expenseType={expenseType}
            setExpenseType={setExpenseType}
            categoryId={categoryId}
            setCategoryId={setCategoryId}
            filteredCategories={filteredCategories}
            year={year}
            month={month}
            onCategoryCreated={handleCategoryCreated}
            defaultDate={defaultDate}
          />

          <LoanActivityFields
            activeLoans={activeLoans}
            recordLoan={recordLoan}
            setRecordLoan={setRecordLoan}
            loanAction={loanAction}
            setLoanAction={setLoanAction}
            loanTarget={loanTarget}
            setLoanTarget={setLoanTarget}
            loanId={loanId}
            setLoanId={setLoanId}
            personName={personName}
            setPersonName={setPersonName}
          />

          {error ? <p className="mt-4 text-sm text-error">{error}</p> : null}

          <FormActions
            cancelHref={cancelHref}
            loading={loading}
            canSubmit={Boolean(canSubmitSingle)}
            submitLabel="Log spending"
          />
        </form>
      ) : (
        <form
          onSubmit={onSubmitMultiple}
          className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-md"
        >
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium" htmlFor="sharedDate">
              Date (shared for all entries)
            </label>
            <input
              id="sharedDate"
              type="date"
              required
              value={sharedDate}
              onChange={(event) => setSharedDate(event.target.value)}
              className="w-full rounded-lg border border-outline-variant px-4 py-3"
            />
          </div>

          <div className="space-y-4">
            {entries.map((entry, index) => {
              const entryCategories = categoriesForWallet(entry.walletId);

              return (
                <div
                  key={entry.id}
                  className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-primary">
                      Expense {index + 1}
                    </p>
                    {entries.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeEntry(entry.id)}
                        className="text-xs font-medium text-error"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium">
                        Amount (PKR)
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={entry.amount}
                        onChange={(event) =>
                          updateEntry(entry.id, { amount: event.target.value })
                        }
                        className="w-full rounded-lg border border-outline-variant px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium">Wallet</label>
                      <select
                        value={entry.walletId}
                        onChange={(event) =>
                          updateEntry(entry.id, { walletId: event.target.value })
                        }
                        className="w-full rounded-lg border border-outline-variant px-3 py-2 text-sm"
                      >
                        {wallets.map((wallet) => (
                          <option key={wallet.id} value={wallet.id}>
                            {wallet.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateEntry(entry.id, {
                            expenseType: "general",
                            categoryId: "",
                          })
                        }
                        className={`rounded-lg border px-3 py-2 text-xs font-medium ${
                          entry.expenseType === "general"
                            ? "border-primary bg-surface-container"
                            : "border-outline-variant/40"
                        }`}
                      >
                        General
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateEntry(entry.id, {
                            expenseType: "category",
                            categoryId: entryCategories[0]?.id ?? "",
                          })
                        }
                        className={`rounded-lg border px-3 py-2 text-xs font-medium ${
                          entry.expenseType === "category"
                            ? "border-primary bg-surface-container"
                            : "border-outline-variant/40"
                        }`}
                      >
                        Category
                      </button>
                    </div>

                    {entry.expenseType === "category" ? (
                      entryCategories.length > 0 ? (
                        <select
                          value={entry.categoryId}
                          onChange={(event) =>
                            updateEntry(entry.id, { categoryId: event.target.value })
                          }
                          className="w-full rounded-lg border border-outline-variant px-3 py-2 text-sm"
                        >
                          {entryCategories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-xs text-on-surface-variant">
                          No categories for this wallet. Use general expense or add
                          a category from the wallet page.
                        </p>
                      )
                    ) : null}

                    <div>
                      <label className="mb-1 block text-xs font-medium">
                        {entry.expenseType === "general"
                          ? "What did you spend on?"
                          : "Note (optional)"}
                      </label>
                      <input
                        type="text"
                        required={entry.expenseType === "general"}
                        value={entry.description}
                        onChange={(event) =>
                          updateEntry(entry.id, { description: event.target.value })
                        }
                        placeholder={
                          entry.expenseType === "general"
                            ? "e.g. Ice cream, snacks"
                            : "Optional note"
                        }
                        className="w-full rounded-lg border border-outline-variant px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addEntry}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-outline-variant px-4 py-3 text-sm font-medium text-primary"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Add another expense
          </button>

          {error ? <p className="mt-4 text-sm text-error">{error}</p> : null}

          <FormActions
            cancelHref={cancelHref}
            loading={loading}
            canSubmit={entries.length > 0}
            submitLabel={`Log ${entries.length} expense${entries.length === 1 ? "" : "s"}`}
          />
        </form>
      )}
    </div>
  );
}

function SingleExpenseFields({
  wallets,
  walletId,
  setWalletId,
  expenseType,
  setExpenseType,
  categoryId,
  setCategoryId,
  filteredCategories,
  year,
  month,
  onCategoryCreated,
  defaultDate,
}: {
  wallets: WalletOption[];
  walletId: string;
  setWalletId: (value: string) => void;
  expenseType: ExpenseType;
  setExpenseType: (value: ExpenseType) => void;
  categoryId: string;
  setCategoryId: (value: string) => void;
  filteredCategories: CategoryOption[];
  year: number;
  month: number;
  onCategoryCreated: (category: CategoryOption) => void;
  defaultDate: string;
}) {
  return (
    <>
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
                onCreated={onCategoryCreated}
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
        <label className="mb-2 block text-sm font-medium" htmlFor="date">
          Date
        </label>
        <input
          id="date"
          name="date"
          type="date"
          required
          defaultValue={defaultDate}
          className="w-full rounded-lg border border-outline-variant px-4 py-3"
        />
      </div>

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
    </>
  );
}

function LoanActivityFields({
  activeLoans,
  recordLoan,
  setRecordLoan,
  loanAction,
  setLoanAction,
  loanTarget,
  setLoanTarget,
  loanId,
  setLoanId,
  personName,
  setPersonName,
}: {
  activeLoans: LoanItem[];
  recordLoan: boolean;
  setRecordLoan: (value: boolean) => void;
  loanAction: LoanActivityAction;
  setLoanAction: (value: LoanActivityAction) => void;
  loanTarget: LoanTarget;
  setLoanTarget: (value: LoanTarget) => void;
  loanId: string;
  setLoanId: (value: string) => void;
  personName: string;
  setPersonName: (value: string) => void;
}) {
  const actionHelp =
    loanAction === "sent"
      ? "Use when money left your wallet for a loan — you lent more, or repaid someone you borrowed from."
      : "Use when money came in for a loan — someone repaid you, or you borrowed more.";

  return (
    <div className="mt-8 rounded-xl border border-outline-variant/30 bg-surface-container-low p-4">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={recordLoan}
          onChange={(event) => setRecordLoan(event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-outline-variant text-primary"
        />
        <div>
          <p className="font-medium text-primary">Also record for a loan</p>
          <p className="mt-1 text-xs text-on-surface-variant">
            Add or subtract this amount on a loan while logging spending.
          </p>
        </div>
      </label>

      {recordLoan ? (
        <div className="mt-4 space-y-4 border-t border-outline-variant/20 pt-4">
          <div>
            <p className="mb-2 text-sm font-medium">Loan activity</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLoanAction("sent")}
                className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                  loanAction === "sent"
                    ? "border-primary bg-primary text-on-primary"
                    : "border-outline-variant/40"
                }`}
              >
                I sent
              </button>
              <button
                type="button"
                onClick={() => setLoanAction("received")}
                className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                  loanAction === "received"
                    ? "border-primary bg-primary text-on-primary"
                    : "border-outline-variant/40"
                }`}
              >
                I received
              </button>
            </div>
            <p className="mt-2 text-xs text-on-surface-variant">{actionHelp}</p>
          </div>

          {activeLoans.length > 0 ? (
            <div>
              <p className="mb-2 text-sm font-medium">Apply to</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLoanTarget("existing")}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                    loanTarget === "existing"
                      ? "border-primary bg-surface-container"
                      : "border-outline-variant/40"
                  }`}
                >
                  Existing loan
                </button>
                <button
                  type="button"
                  onClick={() => setLoanTarget("new")}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                    loanTarget === "new"
                      ? "border-primary bg-surface-container"
                      : "border-outline-variant/40"
                  }`}
                >
                  New loan
                </button>
              </div>
            </div>
          ) : null}

          {loanTarget === "existing" && activeLoans.length > 0 ? (
            <div>
              <label className="mb-2 block text-sm font-medium" htmlFor="loanId">
                Existing loan
              </label>
              <select
                id="loanId"
                value={loanId}
                onChange={(event) => setLoanId(event.target.value)}
                className="w-full rounded-lg border border-outline-variant px-4 py-3"
              >
                {activeLoans.map((loan) => (
                  <option key={loan.id} value={loan.id}>
                    {loan.personName} — {loan.direction === "given" ? "I lent" : "I borrowed"} —{" "}
                    {formatMoney(loan.remaining)} left
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label
                className="mb-2 block text-sm font-medium"
                htmlFor="loanPersonName"
              >
                {loanAction === "sent" ? "Lent to" : "Borrowed from"}
              </label>
              <input
                id="loanPersonName"
                type="text"
                value={personName}
                onChange={(event) => setPersonName(event.target.value)}
                placeholder="e.g. Ali, Ahmed"
                className="w-full rounded-lg border border-outline-variant px-4 py-3"
              />
              <p className="mt-2 text-xs text-on-surface-variant">
                {loanAction === "sent"
                  ? "Creates a new loan for money you sent."
                  : "Creates a new loan for money you received."}
              </p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function FormActions({
  cancelHref,
  loading,
  canSubmit,
  submitLabel,
}: {
  cancelHref: string;
  loading: boolean;
  canSubmit: boolean;
  submitLabel: string;
}) {
  return (
    <div className="mt-8 flex gap-3">
      <Link
        href={cancelHref}
        className="flex-1 rounded-lg border border-outline-variant px-4 py-3 text-center text-sm font-medium"
      >
        Cancel
      </Link>
      <button
        type="submit"
        disabled={loading || !canSubmit}
        className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-on-primary disabled:opacity-60"
      >
        {loading ? "Saving..." : submitLabel}
      </button>
    </div>
  );
}
