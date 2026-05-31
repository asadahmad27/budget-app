"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  readDashboardPeriod,
  writeDashboardPeriod,
} from "@/lib/dashboard-period";

export function ActivePeriodSync() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const yearParam = searchParams.get("year");
  const monthParam = searchParams.get("month");

  useEffect(() => {
    const year = Number(yearParam);
    const month = Number(monthParam);
    const hasValidParams =
      yearParam &&
      monthParam &&
      Number.isInteger(year) &&
      Number.isInteger(month) &&
      month >= 1 &&
      month <= 12;

    if (hasValidParams) {
      writeDashboardPeriod({ year, month });
      return;
    }

    const stored = readDashboardPeriod();
    if (stored) {
      writeDashboardPeriod(stored);
      const params = new URLSearchParams(searchParams.toString());
      params.set("year", String(stored.year));
      params.set("month", String(stored.month));
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
      return;
    }

    router.replace("/months");
  }, [yearParam, monthParam, pathname, router, searchParams]);

  return null;
}
