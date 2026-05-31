import { cookies } from "next/headers";
import {
  DASHBOARD_PERIOD_COOKIE_KEY,
  type DashboardPeriod,
} from "@/lib/dashboard-period";

function isValidPeriod(value: unknown): value is DashboardPeriod {
  if (!value || typeof value !== "object") return false;
  const { year, month } = value as DashboardPeriod;
  return (
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    month >= 1 &&
    month <= 12
  );
}

export async function readDashboardPeriodCookie(): Promise<DashboardPeriod | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(DASHBOARD_PERIOD_COOKIE_KEY)?.value;
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(raw));
    return isValidPeriod(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
