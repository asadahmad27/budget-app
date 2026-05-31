import { AppShell } from "@/components/app-shell";
import { LogTransactionForm } from "@/components/log-transaction-form";
import { resolvePeriodContext } from "@/lib/budget";
import { db } from "@/lib/db";
import { getLoans } from "@/lib/loans";
import { getSession } from "@/lib/session";

export default async function NewTransactionPage({
  searchParams,
}: {
  searchParams: Promise<{
    year?: string;
    month?: string;
    wallet?: string;
    category?: string;
    returnTo?: string;
  }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const params = await searchParams;
  const period = await resolvePeriodContext(session.userId, params);

  const wallets = await db.wallet.findMany({
    where: { userId: session.userId, isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, color: true },
  });

  const categories = await db.category.findMany({
    where: { userId: session.userId },
    orderBy: [{ wallet: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    select: { id: true, name: true, walletId: true },
  });

  const { loans } = await getLoans(session.userId);
  const activeLoans = loans.filter((loan) => !loan.settled);

  return (
    <AppShell
      title="Log Spending"
      showFab={false}
      breadcrumbs={[
        { label: "Months", href: "/months" },
        { label: "Log", href: `/log?year=${period.year}&month=${period.month}` },
        { label: "Log Spending" },
      ]}
    >
      <LogTransactionForm
        year={period.year}
        month={period.month}
        wallets={wallets}
        categories={categories}
        activeLoans={activeLoans}
        initialWalletId={params.wallet}
        initialCategoryId={params.category}
        returnTo={params.returnTo}
      />
    </AppShell>
  );
}
