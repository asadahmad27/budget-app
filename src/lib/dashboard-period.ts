export type DashboardPeriod = {
  year: number;
  month: number;
};

export const DASHBOARD_PERIOD_STORAGE_KEY = "budget-app-dashboard-period";
export const DASHBOARD_PERIOD_COOKIE_KEY = "budget-app-dashboard-period";

const STORAGE_KEY = DASHBOARD_PERIOD_STORAGE_KEY;
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

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

export function readDashboardPeriod(): DashboardPeriod | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValidPeriod(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeDashboardPeriod(period: DashboardPeriod) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(period));
  document.cookie = `${DASHBOARD_PERIOD_COOKIE_KEY}=${encodeURIComponent(JSON.stringify(period))};path=/;max-age=${COOKIE_MAX_AGE_SECONDS};SameSite=Lax`;
}

/** Prefer stored selection over server-rendered fallback (e.g. when URL params lag). */
export function resolveActivePeriod(fallback: DashboardPeriod): DashboardPeriod {
  return readDashboardPeriod() ?? fallback;
}

export function buildPeriodQuery(period: DashboardPeriod) {
  return `year=${period.year}&month=${period.month}`;
}

export function withPeriod(path: string, period: DashboardPeriod) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${buildPeriodQuery(period)}`;
}

export function parsePeriodParams(searchParams: {
  year?: string;
  month?: string;
}): DashboardPeriod | null {
  const year = Number(searchParams.year);
  const month = Number(searchParams.month);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return null;
  }

  return { year, month };
}
