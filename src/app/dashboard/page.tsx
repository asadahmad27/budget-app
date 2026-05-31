import Link from "next/link";
import { Suspense } from "react";
import { ActivePeriodSync } from "@/components/active-period-sync";
import { AppShell } from "@/components/app-shell";
// import { BudgetPeriodForm } from "@/components/budget-period-form";
import { DashboardMonthSwitcher } from "@/components/dashboard-month-nav";
import { TransactionList } from "@/components/transaction-list";
import { getDashboardData, resolvePeriodContext } from "@/lib/budget";
import { formatMoney } from "@/lib/format";
import { getSession } from "@/lib/session";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const params = await searchParams;
  const period = await resolvePeriodContext(session.userId, params);
  const data = await getDashboardData(session.userId, period.year, period.month);

  const topCategories = [...data.categories]
    .filter((category) => category.budgetAmount > 0)
    .sort((a, b) => b.budgetAmount - a.budgetAmount)
    .slice(0, 6);

  return (
    <AppShell
      header={
        <DashboardMonthSwitcher
          year={period.year}
          month={period.month}
          label={period.label}
          // range={period.range}
        />
      }
    >
      <Suspense fallback={null}>
        <ActivePeriodSync />
      </Suspense>
      <div className="space-y-8 pb-8">
        {/* Budget period config hidden for now
        <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6">
          <h3 className="text-lg font-semibold text-primary">Budget period</h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            Set when this month starts and ends. Spending you log below is saved
            to {period.label}.
          </p>
          <BudgetPeriodForm
            budgetPeriodStartDay={period.budgetPeriodStartDay}
            budgetPeriodEndDay={period.budgetPeriodEndDay}
            previewYear={period.year}
            previewMonth={period.month}
          />
        </section>
        */}

        <section className="relative overflow-hidden rounded-xl bg-primary-container p-8 text-on-primary">
          <p className="mb-1 text-sm text-on-primary-container/80">
            Total Funds
          </p>
          <h2 className="text-3xl font-bold">{formatMoney(data.totalFunds)}</h2>
          <p className="mt-4 text-sm text-on-primary-container/80">
            {data.budgetMonth.rolloverEnabled
              ? "Unused wallet balances roll into next month."
              : "Rollover is disabled for the following month."}
          </p>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between">
            <h3 className="text-lg font-semibold text-primary">
              Connected Wallets
            </h3>
            <Link
              href={`/wallets?year=${period.year}&month=${period.month}`}
              className="text-sm font-medium text-secondary hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="-mx-[var(--spacing-margin-mobile)] flex snap-x gap-6 overflow-x-auto px-[var(--spacing-margin-mobile)] pb-4 no-scrollbar">
            {data.wallets.map((wallet) => (
              <Link
                key={wallet.id}
                href={`/wallets?wallet=${wallet.id}&year=${period.year}&month=${period.month}`}
                className="w-72 flex-none snap-start"
              >
                <div
                  className="rounded-xl border-t-4 bg-surface-container-lowest p-6 shadow-[0px_4px_12px_rgba(26,43,72,0.05)] transition-transform hover:-translate-y-1"
                  style={{ borderTopColor: wallet.color }}
                >
                  <div className="mb-8 flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container">
                      <span className="material-symbols-outlined text-primary">
                        account_balance_wallet
                      </span>
                    </div>
                    <span className="text-xs text-on-surface-variant">
                      {wallet.name}
                    </span>
                  </div>
                  <p className="mb-1 text-sm text-on-surface-variant">
                    Current Balance
                  </p>
                  <h4 className="mb-3 text-2xl font-semibold">
                    {formatMoney(wallet.balance)}
                  </h4>
                  <div className="space-y-1 text-xs text-on-surface-variant">
                    <div className="flex items-center justify-between gap-3">
                      <span>Funded this month</span>
                      <span className="font-semibold text-on-surface">
                        {formatMoney(wallet.opening + wallet.added)}
                      </span>
                    </div>
                    {wallet.spent > 0 ? (
                      <div className="flex items-center justify-between gap-3">
                        <span>Spent</span>
                        <span className="font-semibold text-on-surface">
                          {formatMoney(wallet.spent)}
                        </span>
                      </div>
                    ) : null}
                  </div>
                  {wallet.rolloverAmount > 0 ? (
                    <div className="mt-3 flex items-center gap-1.5 text-on-secondary-container">
                      <span className="material-symbols-outlined text-sm">
                        history
                      </span>
                      <p className="text-xs">
                        {formatMoney(wallet.rolloverAmount)} rollover included
                      </p>
                    </div>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">
            Category Budgets
          </h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {topCategories.map((category) => (
              <div
                key={category.id}
                className="rounded-xl bg-surface-container-lowest p-5 shadow-[0px_4px_12px_rgba(26,43,72,0.05)]"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h5 className="font-semibold text-on-surface">
                      {category.name}
                    </h5>
                    <p className="text-xs text-on-surface-variant">
                      {category.walletName}
                    </p>
                  </div>
                  <p className="font-semibold text-primary">
                    {formatMoney(category.budgetAmount)}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">Spent</span>
                    <span className="font-bold text-secondary">
                      {formatMoney(category.spent)} /{" "}
                      {formatMoney(category.budgetAmount)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#E2E8F0]">
                    <div
                      className={`h-full transition-all ${category.spent > category.budgetAmount ? "bg-error" : "bg-secondary"}`}
                      style={{
                        width: `${Math.min(category.progress * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="pb-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-primary">
              Recent Transactions
            </h3>
          </div>
          <TransactionList
            transactions={data.transactions}
            budgetYear={period.year}
            budgetMonth={period.month}
            budgetLabel={period.label}
            wallets={data.wallets.map((wallet) => ({
              id: wallet.id,
              name: wallet.name,
              color: wallet.color,
            }))}
            categories={data.categories.map((category) => ({
              id: category.id,
              name: category.name,
              walletId: category.walletId,
            }))}
          />
        </section>
      </div>
    </AppShell>
  );
}
