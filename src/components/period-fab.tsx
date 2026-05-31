"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  readDashboardPeriod,
  withPeriod,
  type DashboardPeriod,
} from "@/lib/dashboard-period";

export function PeriodFab() {
  const [href, setHref] = useState("/months");

  useEffect(() => {
    const period = readDashboardPeriod();
    setHref(period ? withPeriod("/log", period) : "/months");
  }, []);

  return (
    <Link
      href={href}
      className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg transition-all hover:scale-105 active:scale-90"
    >
      <span className="material-symbols-outlined">add</span>
    </Link>
  );
}
