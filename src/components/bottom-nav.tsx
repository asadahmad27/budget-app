"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  readDashboardPeriod,
  withPeriod,
  type DashboardPeriod,
} from "@/lib/dashboard-period";

const items = [
  {
    href: "/months",
    label: "Months",
    icon: "calendar_month",
    needsPeriod: false,
  },
  {
    href: "/dashboard",
    label: "Overview",
    icon: "dashboard",
    needsPeriod: true,
  },
  {
    href: "/wallets",
    label: "Wallets",
    icon: "account_balance_wallet",
    needsPeriod: true,
  },
  { href: "/loans", label: "Loans", icon: "handshake", needsPeriod: false },
  { href: "/goals", label: "Goals", icon: "flag", needsPeriod: false },
  { href: "/log", label: "Log", icon: "add_circle", needsPeriod: true },
  {
    href: "/settings",
    label: "Settings",
    icon: "settings",
    needsPeriod: true,
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const [period, setPeriod] = useState<DashboardPeriod | null>(null);

  useEffect(() => {
    setPeriod(readDashboardPeriod());
  }, [pathname]);

  function hrefFor(item: (typeof items)[number]) {
    if (!item.needsPeriod || !period) {
      return item.href;
    }

    return withPeriod(item.href, period);
  }

  return (
    <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-xl border-t border-outline-variant bg-surface-container-lowest px-1 py-3 shadow-md">
      {items.map((item) => {
        const href = hrefFor(item);
        const active =
          pathname.startsWith(item.href) ||
          (item.href === "/log" &&
            (pathname.startsWith("/transactions") ||
              pathname.startsWith("/funds")));

        return (
          <Link
            key={item.href}
            href={href}
            className={`flex flex-col items-center justify-center rounded-full px-2 py-1 transition-all active:scale-90 ${
              active
                ? "bg-secondary-container text-on-secondary-container"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            <span
              className={`material-symbols-outlined text-[22px] ${active ? "filled" : ""}`}
            >
              {item.icon}
            </span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
