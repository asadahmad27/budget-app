export const DEFAULT_BUDGET_PERIOD_START_DAY = 1;
export const DEFAULT_BUDGET_PERIOD_END_DAY = 31;
export const MAX_BUDGET_PERIOD_DAY = 31;

export type BudgetPeriod = {
  year: number;
  month: number;
};

export type BudgetPeriodConfig = {
  startDay: number;
  endDay: number;
};

export const DEFAULT_BUDGET_PERIOD: BudgetPeriodConfig = {
  startDay: DEFAULT_BUDGET_PERIOD_START_DAY,
  endDay: DEFAULT_BUDGET_PERIOD_END_DAY,
};

export function normalizeBudgetPeriodDay(value: number) {
  if (!Number.isInteger(value)) {
    return 1;
  }

  return Math.min(MAX_BUDGET_PERIOD_DAY, Math.max(1, value));
}

export function normalizeBudgetPeriodConfig(
  input: Partial<BudgetPeriodConfig> = {},
): BudgetPeriodConfig {
  return {
    startDay: normalizeBudgetPeriodDay(
      input.startDay ?? DEFAULT_BUDGET_PERIOD_START_DAY,
    ),
    endDay: normalizeBudgetPeriodDay(
      input.endDay ?? DEFAULT_BUDGET_PERIOD_END_DAY,
    ),
  };
}

export function isCalendarBudgetPeriod(config: BudgetPeriodConfig) {
  const normalized = normalizeBudgetPeriodConfig(config);
  return (
    normalized.startDay === DEFAULT_BUDGET_PERIOD_START_DAY &&
    normalized.endDay === DEFAULT_BUDGET_PERIOD_END_DAY
  );
}

export function isCustomBudgetPeriod(config: BudgetPeriodConfig) {
  return !isCalendarBudgetPeriod(config);
}

function clampDayToMonth(year: number, month: number, day: number) {
  const lastDay = new Date(year, month, 0).getDate();
  return Math.min(normalizeBudgetPeriodDay(day), lastDay);
}

export function shiftPeriod(year: number, month: number, delta: number) {
  const date = new Date(year, month - 1 + delta, 1);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
  };
}

export function getPeriodBounds(
  year: number,
  month: number,
  config: BudgetPeriodConfig = DEFAULT_BUDGET_PERIOD,
) {
  const { startDay, endDay } = normalizeBudgetPeriodConfig(config);

  if (isCalendarBudgetPeriod({ startDay, endDay })) {
    return {
      start: new Date(year, month - 1, 1, 0, 0, 0, 0),
      end: new Date(year, month, 0, 23, 59, 59, 999),
    };
  }

  const start = new Date(
    year,
    month - 1,
    clampDayToMonth(year, month, startDay),
    0,
    0,
    0,
    0,
  );
  const nextPeriod = shiftPeriod(year, month, 1);
  const end = new Date(
    nextPeriod.year,
    nextPeriod.month - 1,
    clampDayToMonth(nextPeriod.year, nextPeriod.month, endDay),
    23,
    59,
    59,
    999,
  );

  return { start, end };
}

export function resolvePeriodForDate(
  date: Date,
  config: BudgetPeriodConfig = DEFAULT_BUDGET_PERIOD,
) {
  const normalized = normalizeBudgetPeriodConfig(config);

  if (isCalendarBudgetPeriod(normalized)) {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
    };
  }

  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  const { start, end } = getPeriodBounds(year, month, normalized);

  if (date >= start && date <= end) {
    return { year, month };
  }

  if (date < start) {
    return shiftPeriod(year, month, -1);
  }

  return shiftPeriod(year, month, 1);
}

export function getCurrentPeriod(
  config: BudgetPeriodConfig = DEFAULT_BUDGET_PERIOD,
) {
  return resolvePeriodForDate(new Date(), config);
}

export function parsePeriod(
  searchParams: { year?: string; month?: string },
  config: BudgetPeriodConfig = DEFAULT_BUDGET_PERIOD,
  storedPeriod?: { year: number; month: number } | null,
) {
  const current = getCurrentPeriod(config);
  const year = Number(searchParams.year);
  const month = Number(searchParams.month);

  if (
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    month >= 1 &&
    month <= 12
  ) {
    return { year, month };
  }

  if (storedPeriod) {
    return storedPeriod;
  }

  return current;
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
}

export function formatMonthLabel(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function formatPeriodRange(
  year: number,
  month: number,
  config: BudgetPeriodConfig = DEFAULT_BUDGET_PERIOD,
) {
  const normalized = normalizeBudgetPeriodConfig(config);

  if (isCalendarBudgetPeriod(normalized)) {
    return formatMonthLabel(year, month);
  }

  const { start, end } = getPeriodBounds(year, month, normalized);
  return `${formatShortDate(start)} – ${formatShortDate(end)}`;
}

export function formatPeriodLabel(
  year: number,
  month: number,
  config: BudgetPeriodConfig = DEFAULT_BUDGET_PERIOD,
) {
  const normalized = normalizeBudgetPeriodConfig(config);
  const monthLabel = formatMonthLabel(year, month);

  if (isCalendarBudgetPeriod(normalized)) {
    return monthLabel;
  }

  return `${monthLabel} · ${formatPeriodRange(year, month, normalized)}`;
}

export function isCurrentPeriod(
  year: number,
  month: number,
  config: BudgetPeriodConfig = DEFAULT_BUDGET_PERIOD,
) {
  const current = getCurrentPeriod(config);
  return current.year === year && current.month === month;
}

export function isDateInPeriod(
  date: Date,
  year: number,
  month: number,
  config: BudgetPeriodConfig = DEFAULT_BUDGET_PERIOD,
) {
  const { start, end } = getPeriodBounds(year, month, config);
  return date >= start && date <= end;
}

/** @deprecated Use normalizeBudgetPeriodDay */
export function normalizeBudgetPeriodStartDay(value: number) {
  return normalizeBudgetPeriodDay(value);
}

/** @deprecated Use MAX_BUDGET_PERIOD_DAY */
export const MAX_BUDGET_PERIOD_START_DAY = MAX_BUDGET_PERIOD_DAY;
