import Link from "next/link";
import { shiftPeriod } from "@/lib/format";

export function MonthSwitcher({
  year,
  month,
  label,
  range,
  basePath,
}: {
  year: number;
  month: number;
  label: string;
  range?: string;
  budgetPeriodStartDay?: number;
  budgetPeriodEndDay?: number;
  basePath: string;
}) {
  const prev = shiftPeriod(year, month, -1);
  const next = shiftPeriod(year, month, 1);
  // const showRange = Boolean(range);

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`${basePath}?year=${prev.year}&month=${prev.month}`}
        className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface-container-low"
      >
        <span className="material-symbols-outlined text-primary">chevron_left</span>
      </Link>
      <div className="text-center">
        <h1 className="text-lg font-bold text-primary">{label}</h1>
        {/* Budget period range hidden for now
        {showRange ? (
          <p className="text-xs text-on-surface-variant">{range}</p>
        ) : null}
        */}
      </div>
      <Link
        href={`${basePath}?year=${next.year}&month=${next.month}`}
        className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface-container-low"
      >
        <span className="material-symbols-outlined text-primary">chevron_right</span>
      </Link>
    </div>
  );
}
