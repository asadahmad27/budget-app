import { db } from "@/lib/db";
import { parseTransactionDate, toNumber } from "@/lib/format";

export type LoanDirection = "given" | "taken";

export type LoanItem = {
  id: string;
  direction: LoanDirection;
  personName: string;
  amount: number;
  repaidAmount: number;
  remaining: number;
  note: string | null;
  date: Date;
  settled: boolean;
};

export type LoanSummary = {
  givenOutstanding: number;
  takenOutstanding: number;
  givenTotal: number;
  takenTotal: number;
};

function mapLoan(loan: {
  id: string;
  direction: string;
  personName: string;
  amount: unknown;
  repaidAmount: unknown;
  note: string | null;
  date: Date;
  settled: boolean;
}): LoanItem {
  const amount = toNumber(loan.amount);
  const repaidAmount = toNumber(loan.repaidAmount);
  const remaining = loan.settled ? 0 : Math.max(amount - repaidAmount, 0);

  return {
    id: loan.id,
    direction: loan.direction as LoanDirection,
    personName: loan.personName,
    amount,
    repaidAmount,
    remaining,
    note: loan.note,
    date: loan.date,
    settled: loan.settled,
  };
}

export async function getLoans(userId: string) {
  const loans = await db.loan.findMany({
    where: { userId },
    orderBy: [{ settled: "asc" }, { date: "desc" }, { createdAt: "desc" }],
  });

  const items = loans.map(mapLoan);

  const summary = items.reduce<LoanSummary>(
    (acc, loan) => {
      if (loan.direction === "given") {
        acc.givenTotal += loan.amount;
        if (!loan.settled) acc.givenOutstanding += loan.remaining;
      } else {
        acc.takenTotal += loan.amount;
        if (!loan.settled) acc.takenOutstanding += loan.remaining;
      }
      return acc;
    },
    {
      givenOutstanding: 0,
      takenOutstanding: 0,
      givenTotal: 0,
      takenTotal: 0,
    },
  );

  return { loans: items, summary };
}

export async function createLoan(input: {
  userId: string;
  direction: LoanDirection;
  personName: string;
  amount: number;
  repaidAmount?: number;
  note?: string;
  date?: Date;
}) {
  const personName = input.personName.trim();
  if (!personName) {
    throw new Error("Enter who the loan is with");
  }
  if (input.amount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  const repaidAmount = input.repaidAmount ?? 0;
  if (repaidAmount < 0) {
    throw new Error("Repaid amount cannot be negative");
  }
  if (repaidAmount > input.amount) {
    throw new Error("Repaid amount cannot exceed the loan amount");
  }

  const loan = await db.loan.create({
    data: {
      userId: input.userId,
      direction: input.direction,
      personName,
      amount: input.amount,
      repaidAmount,
      note: input.note?.trim() || null,
      date: input.date ?? new Date(),
      settled: repaidAmount >= input.amount,
    },
  });

  return mapLoan(loan);
}

export async function updateLoan(
  userId: string,
  loanId: string,
  input: {
    personName?: string;
    amount?: number;
    repaidAmount?: number;
    note?: string;
    date?: string;
    settled?: boolean;
  },
) {
  const existing = await db.loan.findFirst({
    where: { id: loanId, userId },
  });

  if (!existing) {
    throw new Error("Loan not found");
  }

  const personName =
    input.personName !== undefined ? input.personName.trim() : existing.personName;
  if (!personName) {
    throw new Error("Enter who the loan is with");
  }

  const amount =
    input.amount !== undefined ? input.amount : toNumber(existing.amount);
  if (amount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  const repaidAmount =
    input.repaidAmount !== undefined
      ? input.repaidAmount
      : toNumber(existing.repaidAmount);

  if (repaidAmount < 0) {
    throw new Error("Repaid amount cannot be negative");
  }
  if (repaidAmount > amount) {
    throw new Error("Repaid amount cannot exceed the loan amount");
  }

  const settled =
    input.settled !== undefined
      ? input.settled
      : repaidAmount >= amount || existing.settled;

  const loan = await db.loan.update({
    where: { id: loanId },
    data: {
      personName,
      amount,
      repaidAmount,
      note:
        input.note !== undefined ? input.note.trim() || null : existing.note,
      date: input.date ? parseTransactionDate(input.date) : existing.date,
      settled,
    },
  });

  return mapLoan(loan);
}

export async function deleteLoan(userId: string, loanId: string) {
  const existing = await db.loan.findFirst({
    where: { id: loanId, userId },
  });

  if (!existing) {
    throw new Error("Loan not found");
  }

  await db.loan.delete({ where: { id: loanId } });
}

export type LoanActivityAction = "sent" | "received";

export async function applyLoanActivity(
  userId: string,
  input: {
    action: LoanActivityAction;
    amount: number;
    loanId?: string;
    personName?: string;
    direction?: LoanDirection;
    date?: Date;
    note?: string;
  },
) {
  if (input.amount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  if (input.loanId) {
    const existing = await db.loan.findFirst({
      where: { id: input.loanId, userId },
    });

    if (!existing) {
      throw new Error("Loan not found");
    }

    if (existing.settled) {
      throw new Error("That loan is already settled");
    }

    const direction = existing.direction as LoanDirection;
    const amount = toNumber(existing.amount);
    const repaidAmount = toNumber(existing.repaidAmount);

    if (input.action === "sent") {
      if (direction === "given") {
        return updateLoan(userId, existing.id, {
          amount: amount + input.amount,
        });
      }

      return updateLoan(userId, existing.id, {
        repaidAmount: repaidAmount + input.amount,
      });
    }

    if (direction === "given") {
      return updateLoan(userId, existing.id, {
        repaidAmount: repaidAmount + input.amount,
      });
    }

    return updateLoan(userId, existing.id, {
      amount: amount + input.amount,
    });
  }

  const personName = input.personName?.trim();
  if (!personName) {
    throw new Error("Enter who the loan is with");
  }

  const direction =
    input.direction ?? (input.action === "sent" ? "given" : "taken");

  if (input.action === "sent" && direction === "taken") {
    throw new Error("Select an existing loan you borrowed to record a repayment");
  }

  if (input.action === "received" && direction === "given") {
    throw new Error("Select an existing loan you lent to record a repayment");
  }

  return createLoan({
    userId,
    direction,
    personName,
    amount: input.amount,
    note: input.note,
    date: input.date,
  });
}
