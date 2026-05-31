import { db } from "@/lib/db";
import { toNumber } from "@/lib/format";

export type LifeGoalItem = {
  id: string;
  name: string;
  note: string | null;
  projectedCost: number;
  savedAmount: number;
  remaining: number;
  progress: number;
  walletId: string | null;
  walletName: string | null;
  walletColor: string | null;
};

export type LifeGoalsSummary = {
  totalProjected: number;
  totalSaved: number;
  totalRemaining: number;
};

function mapGoal(goal: {
  id: string;
  name: string;
  note: string | null;
  projectedCost: unknown;
  savedAmount: unknown;
  walletId: string | null;
  wallet: { name: string; color: string } | null;
}): LifeGoalItem {
  const projectedCost = toNumber(goal.projectedCost);
  const savedAmount = toNumber(goal.savedAmount);
  const remaining = Math.max(projectedCost - savedAmount, 0);
  const progress =
    projectedCost > 0 ? Math.min(savedAmount / projectedCost, 1) : 0;

  return {
    id: goal.id,
    name: goal.name,
    note: goal.note,
    projectedCost,
    savedAmount,
    remaining,
    progress,
    walletId: goal.walletId,
    walletName: goal.wallet?.name ?? null,
    walletColor: goal.wallet?.color ?? null,
  };
}

async function validateWallet(userId: string, walletId: string | null | undefined) {
  if (!walletId) return null;

  const wallet = await db.wallet.findFirst({
    where: { id: walletId, userId, isActive: true },
  });

  if (!wallet) {
    throw new Error("Wallet not found or inactive");
  }

  return wallet.id;
}

export async function getLifeGoals(userId: string) {
  const goals = await db.lifeGoal.findMany({
    where: { userId },
    include: { wallet: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const items = goals.map(mapGoal);

  const summary = items.reduce<LifeGoalsSummary>(
    (acc, goal) => {
      acc.totalProjected += goal.projectedCost;
      acc.totalSaved += goal.savedAmount;
      acc.totalRemaining += goal.remaining;
      return acc;
    },
    { totalProjected: 0, totalSaved: 0, totalRemaining: 0 },
  );

  return { goals: items, summary };
}

export async function getGoalWalletOptions(userId: string) {
  return db.wallet.findMany({
    where: { userId, isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, color: true },
  });
}

export async function createLifeGoal(input: {
  userId: string;
  name: string;
  note?: string;
  projectedCost: number;
  savedAmount?: number;
  walletId?: string | null;
}) {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Enter a goal name");
  }
  if (input.projectedCost <= 0) {
    throw new Error("Projected cost must be greater than zero");
  }

  const savedAmount = input.savedAmount ?? 0;
  if (savedAmount < 0) {
    throw new Error("Saved amount cannot be negative");
  }

  const walletId = await validateWallet(input.userId, input.walletId);

  const count = await db.lifeGoal.count({ where: { userId: input.userId } });

  const goal = await db.lifeGoal.create({
    data: {
      userId: input.userId,
      name,
      note: input.note?.trim() || null,
      projectedCost: input.projectedCost,
      savedAmount,
      walletId,
      sortOrder: count,
    },
    include: { wallet: true },
  });

  return mapGoal(goal);
}

export async function updateLifeGoal(
  userId: string,
  goalId: string,
  input: {
    name?: string;
    note?: string;
    projectedCost?: number;
    savedAmount?: number;
    walletId?: string | null;
  },
) {
  const existing = await db.lifeGoal.findFirst({
    where: { id: goalId, userId },
  });

  if (!existing) {
    throw new Error("Goal not found");
  }

  const name =
    input.name !== undefined ? input.name.trim() : existing.name;
  if (!name) {
    throw new Error("Enter a goal name");
  }

  const projectedCost =
    input.projectedCost !== undefined
      ? input.projectedCost
      : toNumber(existing.projectedCost);
  if (projectedCost <= 0) {
    throw new Error("Projected cost must be greater than zero");
  }

  const savedAmount =
    input.savedAmount !== undefined
      ? input.savedAmount
      : toNumber(existing.savedAmount);
  if (savedAmount < 0) {
    throw new Error("Saved amount cannot be negative");
  }

  let walletId = existing.walletId;
  if (input.walletId !== undefined) {
    walletId = await validateWallet(userId, input.walletId);
  }

  const goal = await db.lifeGoal.update({
    where: { id: goalId },
    data: {
      name,
      note:
        input.note !== undefined ? input.note.trim() || null : existing.note,
      projectedCost,
      savedAmount,
      walletId,
    },
    include: { wallet: true },
  });

  return mapGoal(goal);
}

export async function deleteLifeGoal(userId: string, goalId: string) {
  const existing = await db.lifeGoal.findFirst({
    where: { id: goalId, userId },
  });

  if (!existing) {
    throw new Error("Goal not found");
  }

  await db.lifeGoal.delete({ where: { id: goalId } });
}
