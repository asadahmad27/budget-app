import { Suspense } from "react";
import { ActivePeriodSync } from "@/components/active-period-sync";
import { AppShell } from "@/components/app-shell";
import { MonthSwitcher } from "@/components/month-switcher";
import { MoveBudgetMonthForm } from "@/components/move-budget-month-form";
import { ResetBudgetMonthButton } from "@/components/reset-budget-month-button";
import { DeleteAccountForm } from "@/components/delete-account-form";
import { RolloverToggle } from "@/components/rollover-toggle";
import { ensureBudgetMonth, resolvePeriodContext } from "@/lib/budget";
import { getSession } from "@/lib/session";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const params = await searchParams;
  const period = await resolvePeriodContext(session.userId, params);
  const budgetMonth = await ensureBudgetMonth(
    session.userId,
    period.year,
    period.month,
  );

  return (
    <AppShell
      header={
        <MonthSwitcher
          year={period.year}
          month={period.month}
          label={period.label}
          // range={period.range}
          // budgetPeriodStartDay={period.budgetPeriodStartDay}
          // budgetPeriodEndDay={period.budgetPeriodEndDay}
          basePath="/settings"
        />
      }
      breadcrumbs={[
        { label: "Months", href: "/months" },
        { label: "Settings" },
      ]}
    >
      <Suspense fallback={null}>
        <ActivePeriodSync />
      </Suspense>
      <div className="max-w-xl space-y-6 pb-8">
        <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6">
          <h2 className="text-lg font-semibold text-primary">Account</h2>
          <p className="mt-2 text-sm text-on-surface-variant">{session.email}</p>
        </section>

        <section className="rounded-xl border border-error/30 bg-error-container/10 p-6">
          <h2 className="text-lg font-semibold text-error">Delete account</h2>
          <DeleteAccountForm email={session.email} />
        </section>

        <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6">
          <h2 className="text-lg font-semibold text-primary">Move budget month</h2>
          <MoveBudgetMonthForm
            year={period.year}
            month={period.month}
            budgetPeriodStartDay={period.budgetPeriodStartDay}
            budgetPeriodEndDay={period.budgetPeriodEndDay}
          />
        </section>

        <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6">
          <h2 className="text-lg font-semibold text-primary">Reset budget</h2>
          <ResetBudgetMonthButton
            year={period.year}
            month={period.month}
            budgetPeriodStartDay={period.budgetPeriodStartDay}
            budgetPeriodEndDay={period.budgetPeriodEndDay}
          />
        </section>

        <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6">
          <h2 className="text-lg font-semibold text-primary">Monthly rollover</h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            For {period.label}, choose whether unused wallet balances carry into the next month.
            {/* was: {period.periodLabel} */}
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
