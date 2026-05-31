import Link from "next/link";
import { Suspense } from "react";
import { ActivePeriodSync } from "@/components/active-period-sync";
import { AppShell } from "@/components/app-shell";
import { resolvePeriodContext } from "@/lib/budget";
import { getSession } from "@/lib/session";

export default async function LogHubPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const params = await searchParams;
  const period = await resolvePeriodContext(session.userId, params);
  const query = `year=${period.year}&month=${period.month}`;

  return (
    <AppShell title="Log" showFab={false}>
      <Suspense fallback={null}>
        <ActivePeriodSync />
      </Suspense>
      <div className="mx-auto grid max-w-2xl gap-4 pb-8">
        <Link
          href={`/transactions/new?${query}`}
          className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm transition-transform hover:-translate-y-0.5"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="material-symbols-outlined">shopping_cart</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-primary">Log spending</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Record an expense for the month you selected.
              </p>
            </div>
          </div>
        </Link>

        <Link
          href={`/funds/new?${query}`}
          className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm transition-transform hover:-translate-y-0.5"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 text-secondary">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-primary">Add funds</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Record money received — salary, transfer, or top-up. Adds to your
                wallet balance for this month.
              </p>
            </div>
          </div>
        </Link>
      </div>
    </AppShell>
  );
}
