import { AppShell } from "@/components/app-shell";
import { MonthPickerGrid } from "@/components/month-picker-grid";
import { getUserBudgetSettings, getYearMonthOverview } from "@/lib/budget";
import { getCurrentPeriod } from "@/lib/format";
import { getSession } from "@/lib/session";

export default async function MonthsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const params = await searchParams;
  const current = getCurrentPeriod();
  const year = Number(params.year ?? current.year);
  const displayYear =
    Number.isInteger(year) && year >= 2000 && year <= 2100
      ? year
      : current.year;

  const [{ budgetPeriodStartDay, budgetPeriodEndDay }, months] =
    await Promise.all([
      getUserBudgetSettings(session.userId),
      getYearMonthOverview(session.userId, displayYear),
    ]);

  return (
    <AppShell title="Months" showFab={false}>
      <div className="pb-8">
        <MonthPickerGrid
          year={displayYear}
          months={months}
          budgetPeriodStartDay={budgetPeriodStartDay}
          budgetPeriodEndDay={budgetPeriodEndDay}
        />
      </div>
    </AppShell>
  );
}
