import { AppShell } from "@/components/app-shell";
import { RolloverToggle } from "@/components/rollover-toggle";
import { ensureBudgetMonth } from "@/lib/budget";
import { formatMonthLabel, parsePeriod } from "@/lib/format";
import { getSession } from "@/lib/session";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const params = await searchParams;
  const period = parsePeriod(params);
  const budgetMonth = await ensureBudgetMonth(
    session.userId,
    period.year,
    period.month,
  );

  return (
    <AppShell
      title="Settings"
      breadcrumbs={[
        { label: "Home", href: `/dashboard?year=${period.year}&month=${period.month}` },
        { label: "Settings" },
      ]}
    >
      <div className="max-w-xl space-y-6 pb-8">
        <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6">
          <h2 className="text-lg font-semibold text-primary">Account</h2>
          <p className="mt-2 text-sm text-on-surface-variant">{session.email}</p>
        </section>

        <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6">
          <h2 className="text-lg font-semibold text-primary">Monthly rollover</h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            For {formatMonthLabel(period.year, period.month)}, choose whether
            unused wallet balances carry into the next month.
          </p>
          <RolloverToggle
            year={period.year}
            month={period.month}
            enabled={budgetMonth.rolloverEnabled}
          />
        </section>
      </div>
    </AppShell>
  );
}
