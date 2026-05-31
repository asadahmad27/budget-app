export function formatMoney(amount: number | string, currency = "PKR") {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return `${value.toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })} ${currency}`;
}

export {
  formatMonthLabel,
  formatPeriodLabel,
  formatPeriodRange,
  getCurrentPeriod,
  parsePeriod,
  shiftPeriod,
} from "@/lib/budget-period";

export function formatMonthShort(month: number) {
  return new Date(2000, month - 1, 1).toLocaleDateString("en-US", {
    month: "short",
  });
}

export function formatAmountCompact(amount: number) {
  return amount.toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseTransactionDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new Error("Invalid date");
  }

  const parsedYear = Number(match[1]);
  const parsedMonth = Number(match[2]);
  const parsedDay = Number(match[3]);
  const date = new Date(parsedYear, parsedMonth - 1, parsedDay, 12, 0, 0, 0);

  if (
    date.getFullYear() !== parsedYear ||
    date.getMonth() + 1 !== parsedMonth ||
    date.getDate() !== parsedDay
  ) {
    throw new Error("Invalid date");
  }

  return date;
}

export function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (
    value &&
    typeof value === "object" &&
    "toNumber" in value &&
    typeof (value as { toNumber: () => number }).toNumber === "function"
  ) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value);
}
