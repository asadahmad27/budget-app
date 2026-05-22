import { AppShell } from "@/components/app-shell";
import { LogTransactionForm } from "@/components/log-transaction-form";
import { db } from "@/lib/db";
import { parsePeriod } from "@/lib/format";
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
  const period = parsePeriod(params);

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

  return (
    <AppShell
      title="Log Spending"
      showFab={false}
      breadcrumbs={[
        { label: "Home", href: `/dashboard?year=${period.year}&month=${period.month}` },
        { label: "Log Spending" },
      ]}
    >
      <LogTransactionForm
        year={period.year}
        month={period.month}
        wallets={wallets}
        categories={categories}
        initialWalletId={params.wallet}
        initialCategoryId={params.category}
        returnTo={params.returnTo}
      />
    </AppShell>
  );
}
