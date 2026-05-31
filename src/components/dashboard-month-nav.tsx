"use client";

import Link from "next/link";
import { writeDashboardPeriod } from "@/lib/dashboard-period";
import { shiftPeriod } from "@/lib/format";

export function DashboardMonthSwitcher({
  year,
  month,
  label,
  range,
}: {
  year: number;
  month: number;
  label: string;
  range?: string;
}) {
  const prev = shiftPeriod(year, month, -1);
  const next = shiftPeriod(year, month, 1);

  function persist(period: { year: number; month: number }) {
    writeDashboardPeriod(period);
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/dashboard?year=${prev.year}&month=${prev.month}`}
        onClick={() => persist(prev)}
        className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface-container-low"
      >
        <span className="material-symbols-outlined text-primary">chevron_left</span>
      </Link>
      <div className="text-center">
        <Link
          href="/months"
          className="block text-lg font-bold text-primary hover:underline"
        >
          {label}
        </Link>
        {/* Budget period range hidden for now
        {range ? (
          <p className="text-xs text-on-surface-variant">{range}</p>
        ) : null}
        */}
      </div>
      <Link
        href={`/dashboard?year=${next.year}&month=${next.month}`}
        onClick={() => persist(next)}
        className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface-container-low"
      >
        <span className="material-symbols-outlined text-primary">chevron_right</span>
      </Link>
    </div>
  );
}
