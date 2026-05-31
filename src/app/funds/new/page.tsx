import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { LogFundsForm } from "@/components/log-funds-form";
import { resolvePeriodContext } from "@/lib/budget";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export default async function NewFundsPage({
  searchParams,
}: {
  searchParams: Promise<{
    year?: string;
    month?: string;
    wallet?: string;
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

  return (
    <AppShell
      title="Add Funds"
      showFab={false}
      breadcrumbs={[
        { label: "Months", href: "/months" },
        { label: "Log", href: `/log?year=${period.year}&month=${period.month}` },
        { label: "Add Funds" },
      ]}
    >
      <LogFundsForm
        year={period.year}
        month={period.month}
        wallets={wallets}
        initialWalletId={params.wallet}
        returnTo={params.returnTo}
      />
    </AppShell>
  );
}
