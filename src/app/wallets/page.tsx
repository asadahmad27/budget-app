import Link from "next/link";
import { AddCategoryForm } from "@/components/add-category-form";
import { AppShell } from "@/components/app-shell";
import { CategoryBudgetCard } from "@/components/category-budget-card";
import { CategoryTotalsSummary } from "@/components/category-totals-summary";
import { DeactivateWalletButton } from "@/components/deactivate-wallet-button";
import { MonthSwitcher } from "@/components/month-switcher";
import { WalletFundingForm } from "@/components/wallet-funding-form";
import { getWalletPageData } from "@/lib/budget";
import { formatMoney, formatMonthLabel, parsePeriod } from "@/lib/format";
import { getSession } from "@/lib/session";

export default async function WalletsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; wallet?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const params = await searchParams;
  const period = parsePeriod(params);
  const data = await getWalletPageData(
    session.userId,
    period.year,
    period.month,
    params.wallet,
  );
  const monthLabel = formatMonthLabel(period.year, period.month);
  const totalCategoryBudget = data.walletCategories.reduce(
    (sum, category) => sum + category.budgetAmount,
    0,
  );
  const totalCategorySpent = data.walletCategories.reduce(
    (sum, category) => sum + category.spent,
    0,
  );
  const totalCategoryUnspent = data.walletCategories.reduce(
    (sum, category) => sum + Math.max(0, category.remaining),
    0,
  );

  return (
    <AppShell
      header={
        <MonthSwitcher
          year={period.year}
          month={period.month}
          label={monthLabel}
          basePath="/wallets"
        />
      }
      breadcrumbs={[
        { label: "Home", href: `/dashboard?year=${period.year}&month=${period.month}` },
        { label: "Wallets" },
        ...(data.selectedWallet
          ? [{ label: data.selectedWallet.name }]
          : []),
      ]}
    >
      <div className="space-y-8 pb-8">
        <section className="flex items-center justify-between gap-3">
          <p className="text-sm text-on-surface-variant">
            {data.wallets.length} wallet{data.wallets.length === 1 ? "" : "s"} active
          </p>
          <Link
            href={`/wallets/manage?year=${period.year}&month=${period.month}`}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary"
          >
            Add Pakistani wallets
          </Link>
        </section>

        <section className="flex gap-2 overflow-x-auto no-scrollbar">
          {data.wallets.map((wallet) => {
            const active = wallet.id === data.selectedWalletId;
            return (
              <Link
                key={wallet.id}
                href={`/wallets?wallet=${wallet.id}&year=${period.year}&month=${period.month}`}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${
                  active
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-low text-on-surface-variant"
                }`}
              >
                {wallet.name}
              </Link>
            );
          })}
        </section>

        {data.selectedWallet ? (
          <>
            <section
              className="rounded-xl border-t-4 bg-surface-container-lowest p-8 shadow-sm"
              style={{ borderTopColor: data.selectedWallet.color }}
            >
              <p className="text-sm text-on-surface-variant">Wallet Balance</p>
              <h2 className="mt-2 text-4xl font-bold text-primary">
                {formatMoney(data.selectedWallet.balance)}
              </h2>
              <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-on-surface-variant">Opening</p>
                  <p className="font-semibold">
                    {formatMoney(data.selectedWallet.opening)}
                  </p>
                </div>
                <div>
                  <p className="text-on-surface-variant">Added</p>
                  <p className="font-semibold">
                    {formatMoney(data.selectedWallet.added)}
                  </p>
                </div>
                <div>
                  <p className="text-on-surface-variant">Spent</p>
                  <p className="font-semibold">
                    {formatMoney(data.selectedWallet.spent)}
                  </p>
                </div>
              </div>
            </section>

            <WalletFundingForm
              walletId={data.selectedWallet.id}
              year={period.year}
              month={period.month}
              openingBalance={data.selectedWallet.opening}
              addedAmount={data.selectedWallet.added}
            />

            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">Categories</h3>

              {data.selectedWalletId ? (
                <AddCategoryForm
                  walletId={data.selectedWalletId}
                  year={period.year}
                  month={period.month}
                />
              ) : null}

              <div className="space-y-3">
                {data.walletCategories.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">
                    No categories for this wallet yet.
                  </p>
                ) : (
                  data.walletCategories.map((category) => (
                    <CategoryBudgetCard
                      key={category.id}
                      category={category}
                      walletId={category.walletId}
                      year={period.year}
                      month={period.month}
                    />
                  ))
                )}
              </div>

              {data.walletCategories.length > 0 ? (
                <CategoryTotalsSummary
                  totalBudget={totalCategoryBudget}
                  totalUnspent={totalCategoryUnspent}
                  totalSpent={totalCategorySpent}
                  categoryCount={data.walletCategories.length}
                  lastMonthUnspent={data.lastMonthCategoryTotals.totalUnspent}
                  lastMonthBudget={data.lastMonthCategoryTotals.totalBudget}
                  lastMonthSpent={data.lastMonthCategoryTotals.totalSpent}
                  lastMonthYear={data.lastMonthCategoryTotals.year}
                  lastMonthMonth={data.lastMonthCategoryTotals.month}
                />
              ) : null}
            </section>

            <DeactivateWalletButton
              walletId={data.selectedWallet.id}
              walletName={data.selectedWallet.name}
              balance={data.selectedWallet.balance}
              year={period.year}
              month={period.month}
            />
          </>
        ) : (
          <p className="text-sm text-on-surface-variant">
            No active wallets. Add one from the Pakistani wallets catalog.
          </p>
        )}
      </div>
    </AppShell>
  );
}
