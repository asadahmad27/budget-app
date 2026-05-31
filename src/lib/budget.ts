import { Prisma } from "@prisma/client";
import { db, ensureDbConnection } from "@/lib/db";
import {
  DEFAULT_BUDGET_PERIOD,
  formatMonthLabel,
  formatPeriodLabel,
  formatPeriodRange,
  getCurrentPeriod,
  isCustomBudgetPeriod,
  normalizeBudgetPeriodConfig,
  parsePeriod,
  type BudgetPeriodConfig,
} from "@/lib/budget-period";
import { readDashboardPeriodCookie } from "@/lib/dashboard-period-server";
import { toNumber } from "@/lib/format";
import {
  applyLoanActivity,
  type LoanActivityAction,
} from "@/lib/loans";
import {
  getWalletProvider,
  PAKISTANI_WALLET_CATALOG,
  type WalletProvider,
} from "@/lib/wallet-catalog";

function previousPeriod(year: number, month: number) {
  const date = new Date(year, month - 2, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export async function getUserBudgetSettings(userId: string) {
  await ensureDbConnection();

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { budgetPeriodStartDay: true, budgetPeriodEndDay: true },
  });

  const budgetPeriod = normalizeBudgetPeriodConfig({
    startDay: user?.budgetPeriodStartDay,
    endDay: user?.budgetPeriodEndDay,
  });

  return {
    budgetPeriodStartDay: budgetPeriod.startDay,
    budgetPeriodEndDay: budgetPeriod.endDay,
    budgetPeriod,
  };
}

export async function updateBudgetPeriodSettings(
  userId: string,
  input: Partial<BudgetPeriodConfig>,
) {
  const budgetPeriod = normalizeBudgetPeriodConfig(input);

  return db.user.update({
    where: { id: userId },
    data: {
      budgetPeriodStartDay: budgetPeriod.startDay,
      budgetPeriodEndDay: budgetPeriod.endDay,
    },
  });
}

/** @deprecated Use updateBudgetPeriodSettings */
export async function updateBudgetPeriodStartDay(
  userId: string,
  startDay: number,
) {
  return updateBudgetPeriodSettings(userId, { startDay });
}

export async function resolvePeriodContext(
  userId: string,
  searchParams: { year?: string; month?: string },
) {
  const { budgetPeriod } = await getUserBudgetSettings(userId);
  const storedPeriod = await readDashboardPeriodCookie();
  const period = parsePeriod(searchParams, budgetPeriod, storedPeriod);

  return {
    ...period,
    budgetPeriodStartDay: budgetPeriod.startDay,
    budgetPeriodEndDay: budgetPeriod.endDay,
    budgetPeriod,
    label: formatMonthLabel(period.year, period.month),
    range: isCustomBudgetPeriod(budgetPeriod)
      ? formatPeriodRange(period.year, period.month, budgetPeriod)
      : undefined,
    periodLabel: formatPeriodLabel(period.year, period.month, budgetPeriod),
  };
}

export async function seedUserDefaults(_userId: string) {
  // Wallets and opening balances are set during onboarding.
}

export async function completeOnboarding(
  userId: string,
  items: Array<{ providerKey: string; openingBalance: number }>,
) {
  if (items.length === 0) {
    throw new Error("Select at least one wallet");
  }

  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.providerKey)) {
      throw new Error("Duplicate wallet selected");
    }
    seen.add(item.providerKey);

    const provider = getWalletProvider(item.providerKey);
    if (!provider) {
      throw new Error(`Unknown wallet: ${item.providerKey}`);
    }
    if (!Number.isFinite(item.openingBalance) || item.openingBalance < 0) {
      throw new Error("Opening amount must be zero or greater");
    }
  }

  const { budgetPeriod } = await getUserBudgetSettings(userId);
  const { year, month } = getCurrentPeriod(budgetPeriod);

  const createdWallets: Array<{
    walletId: string;
    provider: WalletProvider;
    openingBalance: number;
  }> = [];

  for (const [index, item] of items.entries()) {
    const provider = getWalletProvider(item.providerKey)!;
    const wallet = await createWalletFromProvider(userId, provider, index, {
      attachToCurrentMonth: false,
    });
    createdWallets.push({
      walletId: wallet.id,
      provider,
      openingBalance: item.openingBalance,
    });
  }

  const budgetMonth = await ensureBudgetMonth(userId, year, month);

  for (const { walletId, provider, openingBalance } of createdWallets) {
    await attachWalletToBudgetMonth(
      budgetMonth.id,
      walletId,
      openingBalance,
      provider,
    );
  }

  await db.user.update({
    where: { id: userId },
    data: { onboardingCompleted: true },
  });
}

async function createWalletFromProvider(
  userId: string,
  provider: WalletProvider,
  sortOrder: number,
  options?: { attachToCurrentMonth?: boolean },
) {
  const wallet = await db.wallet.create({
    data: {
      userId,
      name: provider.name,
      color: provider.color,
      type: provider.type,
      providerKey: provider.key,
      sortOrder,
    },
  });

  for (const [index, category] of (provider.categories ?? []).entries()) {
    await db.category.create({
      data: {
        userId,
        walletId: wallet.id,
        name: category.name,
        sortOrder: index,
      },
    });
  }

  if (options?.attachToCurrentMonth !== false) {
    const { budgetPeriod } = await getUserBudgetSettings(userId);
    const { year, month } = getCurrentPeriod(budgetPeriod);
    const budgetMonth = await ensureBudgetMonth(userId, year, month);
    await attachWalletToBudgetMonth(
      budgetMonth.id,
      wallet.id,
      provider.defaultOpening ?? 0,
      provider,
    );
  }

  return wallet;
}

async function attachWalletToBudgetMonth(
  budgetMonthId: string,
  walletId: string,
  openingBalance: number,
  provider?: WalletProvider,
) {
  const wallet = await db.wallet.findUnique({
    where: { id: walletId },
    include: { categories: { orderBy: { sortOrder: "asc" } } },
  });

  if (!wallet) return;

  const resolvedProvider =
    provider ??
    (wallet.providerKey ? getWalletProvider(wallet.providerKey) : undefined);

  await db.walletMonth.upsert({
    where: {
      budgetMonthId_walletId: {
        budgetMonthId,
        walletId,
      },
    },
    update: {},
    create: {
      budgetMonthId,
      walletId,
      openingBalance,
      addedAmount: 0,
    },
  });

  for (const category of wallet.categories) {
    const categoryDef = resolvedProvider?.categories?.find(
      (item) => item.name === category.name,
    );

    await db.categoryBudget.upsert({
      where: {
        budgetMonthId_categoryId: {
          budgetMonthId,
          categoryId: category.id,
        },
      },
      update: {},
      create: {
        budgetMonthId,
        categoryId: category.id,
        budgetAmount: categoryDef?.budget ?? 0,
      },
    });
  }
}

export async function addWalletFromCatalog(userId: string, providerKey: string) {
  const provider = getWalletProvider(providerKey);
  if (!provider) {
    throw new Error("Wallet provider not found");
  }

  const existing = await db.wallet.findFirst({
    where: { userId, providerKey },
  });

  if (existing) {
    if (existing.isActive) {
      throw new Error("This wallet is already added");
    }
    return reactivateWallet(userId, existing.id);
  }

  const maxSort = await db.wallet.aggregate({
    where: { userId },
    _max: { sortOrder: true },
  });

  return createWalletFromProvider(
    userId,
    provider,
    (maxSort._max.sortOrder ?? -1) + 1,
  );
}

export async function addAllMissingWallets(userId: string) {
  const existing = await db.wallet.findMany({
    where: { userId, isActive: true },
    select: { providerKey: true },
  });

  const activeKeys = new Set(
    existing.map((wallet) => wallet.providerKey).filter(Boolean),
  );

  const added = [];
  let sortOrder =
    (
      await db.wallet.aggregate({
        where: { userId },
        _max: { sortOrder: true },
      })
    )._max.sortOrder ?? -1;

  for (const provider of PAKISTANI_WALLET_CATALOG) {
    if (activeKeys.has(provider.key)) continue;

    const hidden = await db.wallet.findFirst({
      where: { userId, providerKey: provider.key, isActive: false },
    });

    if (hidden) {
      added.push(await reactivateWallet(userId, hidden.id));
      continue;
    }

    sortOrder += 1;
    added.push(await createWalletFromProvider(userId, provider, sortOrder));
  }

  return added;
}

export async function getWalletCatalogForUser(userId: string) {
  const userWallets = await db.wallet.findMany({
    where: { userId },
    select: { id: true, providerKey: true, isActive: true },
  });

  const walletByKey = new Map(
    userWallets
      .filter((wallet) => wallet.providerKey)
      .map((wallet) => [wallet.providerKey!, wallet]),
  );

  return PAKISTANI_WALLET_CATALOG.map((provider) => {
    const wallet = walletByKey.get(provider.key);

    return {
      ...provider,
      added: wallet?.isActive ?? false,
      hidden: wallet ? !wallet.isActive : false,
      walletId: wallet?.id,
    };
  });
}

export async function getWalletBalance(
  userId: string,
  walletId: string,
  year: number,
  month: number,
) {
  const budgetMonth = await ensureBudgetMonth(userId, year, month);
  const walletMonth = await db.walletMonth.findUnique({
    where: {
      budgetMonthId_walletId: {
        budgetMonthId: budgetMonth.id,
        walletId,
      },
    },
  });
  const spent = await getWalletSpent(budgetMonth.id, walletId);

  return (
    toNumber(walletMonth?.openingBalance ?? 0) +
    toNumber(walletMonth?.addedAmount ?? 0) -
    spent
  );
}

export async function deactivateWallet(
  userId: string,
  walletId: string,
  year: number,
  month: number,
) {
  const wallet = await db.wallet.findFirst({
    where: { id: walletId, userId, isActive: true },
  });

  if (!wallet) {
    throw new Error("Wallet not found");
  }

  const balance = await getWalletBalance(userId, walletId, year, month);
  if (balance !== 0) {
    throw new Error(
      "Wallet balance must be zero before hiding it. Spend or move remaining funds first.",
    );
  }

  return db.wallet.update({
    where: { id: walletId },
    data: { isActive: false },
  });
}

export async function reactivateWallet(userId: string, walletId: string) {
  const wallet = await db.wallet.findFirst({
    where: { id: walletId, userId, isActive: false },
  });

  if (!wallet) {
    throw new Error("Hidden wallet not found");
  }

  const updated = await db.wallet.update({
    where: { id: walletId },
    data: { isActive: true },
  });

  const { budgetPeriod } = await getUserBudgetSettings(userId);
  const { year, month } = getCurrentPeriod(budgetPeriod);
  const budgetMonth = await ensureBudgetMonth(userId, year, month);
  const provider = wallet.providerKey
    ? getWalletProvider(wallet.providerKey)
    : undefined;

  await attachWalletToBudgetMonth(budgetMonth.id, wallet.id, 0, provider);

  return updated;
}

async function getWalletSpent(
  budgetMonthId: string,
  walletId: string,
  tx?: Prisma.TransactionClient,
) {
  const client = tx ?? db;
  const result = await client.transaction.aggregate({
    where: { budgetMonthId, walletId },
    _sum: { amount: true },
  });
  return toNumber(result._sum.amount ?? 0);
}

async function getCategorySpent(
  budgetMonthId: string,
  categoryId: string,
  tx?: Prisma.TransactionClient,
) {
  const client = tx ?? db;
  const result = await client.transaction.aggregate({
    where: { budgetMonthId, categoryId },
    _sum: { amount: true },
  });
  return toNumber(result._sum.amount ?? 0);
}

export async function ensureBudgetMonth(
  userId: string,
  year: number,
  month: number,
  options?: { seedOpeningBalances?: boolean },
) {
  const existing = await db.budgetMonth.findUnique({
    where: { userId_year_month: { userId, year, month } },
    include: {
      walletMonths: true,
      categoryBudgets: true,
    },
  });

  if (existing) return existing;

  const wallets = await db.wallet.findMany({
    where: { userId, isActive: true },
    include: { categories: { orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });

  const prev = previousPeriod(year, month);
  const previousMonth = await db.budgetMonth.findUnique({
    where: { userId_year_month: { userId, year: prev.year, month: prev.month } },
    include: { walletMonths: true, categoryBudgets: true },
  });

  const rolloverEnabled = previousMonth?.rolloverEnabled ?? true;
  const walletOpening = new Map<string, number>();
  const categoryBudgets = new Map<string, number>();

  if (previousMonth) {
    for (const walletMonth of previousMonth.walletMonths) {
      const spent = await getWalletSpent(previousMonth.id, walletMonth.walletId);
      const remaining =
        toNumber(walletMonth.openingBalance) +
        toNumber(walletMonth.addedAmount) -
        spent;
      walletOpening.set(
        walletMonth.walletId,
        rolloverEnabled ? Math.max(remaining, 0) : 0,
      );
    }
  } else if (options?.seedOpeningBalances) {
    for (const wallet of wallets) {
      const provider = wallet.providerKey
        ? getWalletProvider(wallet.providerKey)
        : undefined;
      walletOpening.set(wallet.id, provider?.defaultOpening ?? 0);

      for (const category of wallet.categories) {
        const match = provider?.categories?.find(
          (item) => item.name === category.name,
        );
        categoryBudgets.set(category.id, match?.budget ?? 0);
      }
    }
  }

  return db.budgetMonth.create({
    data: {
      userId,
      year,
      month,
      rolloverEnabled,
      walletMonths: {
        create: wallets.map((wallet) => ({
          walletId: wallet.id,
          openingBalance: walletOpening.get(wallet.id) ?? 0,
          addedAmount: 0,
        })),
      },
      categoryBudgets: {
        create: wallets.flatMap((wallet) =>
          wallet.categories.map((category) => ({
            categoryId: category.id,
            budgetAmount: categoryBudgets.get(category.id) ?? 0,
          })),
        ),
      },
    },
    include: {
      walletMonths: true,
      categoryBudgets: true,
    },
  });
}

export async function getDashboardData(
  userId: string,
  year: number,
  month: number,
) {
  const budgetMonth = await ensureBudgetMonth(userId, year, month);

  const wallets = await db.wallet.findMany({
    where: { userId, isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  const walletMonths = await db.walletMonth.findMany({
    where: { budgetMonthId: budgetMonth.id },
  });

  const categories = await db.category.findMany({
    where: { userId, wallet: { isActive: true } },
    include: { wallet: true },
    orderBy: [{ wallet: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });

  const categoryBudgets = await db.categoryBudget.findMany({
    where: { budgetMonthId: budgetMonth.id },
  });

  const transactions = await db.transaction.findMany({
    where: { budgetMonthId: budgetMonth.id },
    include: { wallet: true, category: true },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  const walletSummaries = await Promise.all(
    wallets.map(async (wallet) => {
      const walletMonth = walletMonths.find((item) => item.walletId === wallet.id);
      const spent = await getWalletSpent(budgetMonth.id, wallet.id);
      const opening = toNumber(walletMonth?.openingBalance ?? 0);
      const added = toNumber(walletMonth?.addedAmount ?? 0);
      const balance = opening + added - spent;
      const rolloverAmount = opening;

      return {
        id: wallet.id,
        name: wallet.name,
        color: wallet.color,
        opening,
        added,
        spent,
        balance,
        rolloverAmount,
      };
    }),
  );

  const categorySummaries = await Promise.all(
    categories.map(async (category) => {
      const budget = categoryBudgets.find(
        (item) => item.categoryId === category.id,
      );
      const budgetAmount = toNumber(budget?.budgetAmount ?? 0);
      const spent = await getCategorySpent(budgetMonth.id, category.id);
      const remaining = budgetAmount - spent;

      return {
        id: category.id,
        name: category.name,
        walletId: category.walletId,
        walletName: category.wallet.name,
        walletColor: category.wallet.color,
        budgetAmount,
        spent,
        remaining,
        progress: budgetAmount > 0 ? Math.min(spent / budgetAmount, 1) : 0,
      };
    }),
  );

  const totalFunds = walletSummaries.reduce(
    (sum, wallet) => sum + wallet.balance,
    0,
  );

  return {
    budgetMonth,
    totalFunds,
    wallets: walletSummaries,
    categories: categorySummaries,
    transactions: transactions.map((transaction) => ({
      id: transaction.id,
      amount: toNumber(transaction.amount),
      description: transaction.description,
      date: transaction.date,
      walletId: transaction.walletId,
      categoryId: transaction.categoryId,
      walletName: transaction.wallet.name,
      categoryName: transaction.category?.name ?? null,
    })),
  };
}

export type MonthOverview = {
  year: number;
  month: number;
  hasBudget: boolean;
  totalFunds: number;
  totalAllocated: number;
  totalSpent: number;
};

export async function getYearMonthOverview(
  userId: string,
  year: number,
): Promise<MonthOverview[]> {
  const budgetMonths = await db.budgetMonth.findMany({
    where: { userId, year },
    include: { walletMonths: true, categoryBudgets: true },
  });

  const budgetMonthIds = budgetMonths.map((item) => item.id);

  const [walletSpentRows, categorySpentRows] = await Promise.all([
    budgetMonthIds.length
      ? db.transaction.groupBy({
          by: ["budgetMonthId", "walletId"],
          where: { budgetMonthId: { in: budgetMonthIds } },
          _sum: { amount: true },
        })
      : Promise.resolve([]),
    budgetMonthIds.length
      ? db.transaction.groupBy({
          by: ["budgetMonthId", "categoryId"],
          where: {
            budgetMonthId: { in: budgetMonthIds },
            categoryId: { not: null },
          },
          _sum: { amount: true },
        })
      : Promise.resolve([]),
  ]);

  const walletSpentMap = new Map<string, number>();
  for (const row of walletSpentRows) {
    walletSpentMap.set(
      `${row.budgetMonthId}:${row.walletId}`,
      toNumber(row._sum.amount ?? 0),
    );
  }

  const categorySpentMap = new Map<string, number>();
  for (const row of categorySpentRows) {
    if (!row.categoryId) continue;
    categorySpentMap.set(
      `${row.budgetMonthId}:${row.categoryId}`,
      toNumber(row._sum.amount ?? 0),
    );
  }

  const monthData = new Map<number, MonthOverview>();

  for (const budgetMonth of budgetMonths) {
    let totalFunds = 0;
    for (const walletMonth of budgetMonth.walletMonths) {
      const spent =
        walletSpentMap.get(`${budgetMonth.id}:${walletMonth.walletId}`) ?? 0;
      totalFunds +=
        toNumber(walletMonth.openingBalance) +
        toNumber(walletMonth.addedAmount) -
        spent;
    }

    let totalAllocated = 0;
    let totalSpent = 0;
    for (const budget of budgetMonth.categoryBudgets) {
      totalAllocated += toNumber(budget.budgetAmount);
      totalSpent +=
        categorySpentMap.get(`${budgetMonth.id}:${budget.categoryId}`) ?? 0;
    }

    monthData.set(budgetMonth.month, {
      year,
      month: budgetMonth.month,
      hasBudget: true,
      totalFunds,
      totalAllocated,
      totalSpent,
    });
  }

  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    return (
      monthData.get(month) ?? {
        year,
        month,
        hasBudget: false,
        totalFunds: 0,
        totalAllocated: 0,
        totalSpent: 0,
      }
    );
  });
}

export async function getWalletPageData(
  userId: string,
  year: number,
  month: number,
  walletId?: string,
) {
  const dashboard = await getDashboardData(userId, year, month);
  const selectedWalletId = walletId ?? dashboard.wallets[0]?.id;
  const wallet = dashboard.wallets.find((item) => item.id === selectedWalletId);
  const categories = dashboard.categories.filter(
    (category) => category.walletId === selectedWalletId,
  );

  const prev = previousPeriod(year, month);
  let lastMonthCategoryUnspent = 0;
  let lastMonthCategoryBudget = 0;
  let lastMonthCategorySpent = 0;

  if (selectedWalletId) {
    const previousMonth = await db.budgetMonth.findUnique({
      where: {
        userId_year_month: { userId, year: prev.year, month: prev.month },
      },
    });

    if (previousMonth) {
      const previousCategoryBudgets = await db.categoryBudget.findMany({
        where: {
          budgetMonthId: previousMonth.id,
          category: { walletId: selectedWalletId },
        },
      });

      for (const budget of previousCategoryBudgets) {
        const budgetAmount = toNumber(budget.budgetAmount);
        const spent = await getCategorySpent(previousMonth.id, budget.categoryId);
        lastMonthCategoryBudget += budgetAmount;
        lastMonthCategorySpent += spent;
        lastMonthCategoryUnspent += Math.max(0, budgetAmount - spent);
      }
    }
  }

  return {
    ...dashboard,
    selectedWalletId,
    selectedWallet: wallet,
    walletCategories: categories,
    lastMonthCategoryTotals: {
      year: prev.year,
      month: prev.month,
      totalBudget: lastMonthCategoryBudget,
      totalSpent: lastMonthCategorySpent,
      totalUnspent: lastMonthCategoryUnspent,
    },
  };
}

export async function createTransaction(input: {
  userId: string;
  year: number;
  month: number;
  walletId: string;
  categoryId?: string;
  amount: number;
  description?: string;
  date?: Date;
  loan?: {
    action: LoanActivityAction;
    loanId?: string;
    personName?: string;
    direction?: "given" | "taken";
  };
}) {
  if (input.amount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  const description = input.description?.trim() || null;

  if (!input.categoryId && !description) {
    throw new Error("Add a note describing what you spent on");
  }

  const transactionDate = input.date ?? new Date();

  const budgetMonth = await ensureBudgetMonth(
    input.userId,
    input.year,
    input.month,
  );

  const wallet = await db.wallet.findFirst({
    where: { id: input.walletId, userId: input.userId, isActive: true },
  });

  if (!wallet) {
    throw new Error("Wallet not found or inactive");
  }

  if (input.categoryId) {
    const category = await db.category.findFirst({
      where: {
        id: input.categoryId,
        userId: input.userId,
        walletId: input.walletId,
      },
    });

    if (!category) {
      throw new Error("Category does not belong to the selected wallet");
    }
  }

  const transaction = await db.transaction.create({
    data: {
      userId: input.userId,
      budgetMonthId: budgetMonth.id,
      walletId: input.walletId,
      categoryId: input.categoryId ?? null,
      amount: input.amount,
      description,
      date: transactionDate,
    },
  });

  if (input.loan) {
    try {
      await applyLoanActivity(input.userId, {
        action: input.loan.action,
        amount: input.amount,
        loanId: input.loan.loanId,
        personName: input.loan.personName,
        direction: input.loan.direction,
        date: transactionDate,
        note: description ?? undefined,
      });
    } catch (error) {
      await db.transaction.delete({ where: { id: transaction.id } });
      throw error;
    }
  }

  return transaction;
}

export async function createTransactions(
  userId: string,
  year: number,
  month: number,
  date: Date,
  entries: Array<{
    walletId: string;
    categoryId?: string;
    amount: number;
    description?: string;
  }>,
) {
  if (entries.length === 0) {
    throw new Error("Add at least one expense");
  }

  const created = [];
  for (const [index, entry] of entries.entries()) {
    try {
      created.push(
        await createTransaction({
          userId,
          year,
          month,
          walletId: entry.walletId,
          categoryId: entry.categoryId,
          amount: entry.amount,
          description: entry.description,
          date,
        }),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create transaction";
      throw new Error(`Entry ${index + 1}: ${message}`);
    }
  }

  return created;
}

export async function updateTransaction(
  userId: string,
  transactionId: string,
  input: {
    walletId: string;
    categoryId?: string;
    amount: number;
    description?: string;
  },
) {
  const existing = await db.transaction.findFirst({
    where: { id: transactionId, userId },
  });

  if (!existing) {
    throw new Error("Transaction not found");
  }

  if (input.amount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  const description = input.description?.trim() || null;

  if (!input.categoryId && !description) {
    throw new Error("Add a note describing what you spent on");
  }

  const wallet = await db.wallet.findFirst({
    where: { id: input.walletId, userId, isActive: true },
  });

  if (!wallet) {
    throw new Error("Wallet not found or inactive");
  }

  if (input.categoryId) {
    const category = await db.category.findFirst({
      where: {
        id: input.categoryId,
        userId,
        walletId: input.walletId,
      },
    });

    if (!category) {
      throw new Error("Category does not belong to the selected wallet");
    }
  }

  return db.transaction.update({
    where: { id: transactionId },
    data: {
      walletId: input.walletId,
      categoryId: input.categoryId ?? null,
      amount: input.amount,
      description,
    },
  });
}

export async function deleteTransaction(userId: string, transactionId: string) {
  const transaction = await db.transaction.findFirst({
    where: { id: transactionId, userId },
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  await db.transaction.delete({
    where: { id: transactionId },
  });

  return transaction;
}

export async function moveTransactionToMonth(
  userId: string,
  transactionId: string,
  toYear: number,
  toMonth: number,
) {
  const transaction = await db.transaction.findFirst({
    where: { id: transactionId, userId },
    include: { budgetMonth: true },
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  if (
    transaction.budgetMonth.year === toYear &&
    transaction.budgetMonth.month === toMonth
  ) {
    throw new Error("Transaction is already in that month");
  }

  const targetBudgetMonth = await ensureBudgetMonth(userId, toYear, toMonth);

  await db.walletMonth.upsert({
    where: {
      budgetMonthId_walletId: {
        budgetMonthId: targetBudgetMonth.id,
        walletId: transaction.walletId,
      },
    },
    update: {},
    create: {
      budgetMonthId: targetBudgetMonth.id,
      walletId: transaction.walletId,
      openingBalance: 0,
      addedAmount: 0,
    },
  });

  if (transaction.categoryId) {
    await db.categoryBudget.upsert({
      where: {
        budgetMonthId_categoryId: {
          budgetMonthId: targetBudgetMonth.id,
          categoryId: transaction.categoryId,
        },
      },
      update: {},
      create: {
        budgetMonthId: targetBudgetMonth.id,
        categoryId: transaction.categoryId,
        budgetAmount: 0,
      },
    });
  }

  return db.transaction.update({
    where: { id: transactionId },
    data: { budgetMonthId: targetBudgetMonth.id },
  });
}

export async function updateWalletMonthFunding(input: {
  userId: string;
  year: number;
  month: number;
  walletId: string;
  openingBalance?: number;
  addedAmount?: number;
}) {
  const budgetMonth = await ensureBudgetMonth(
    input.userId,
    input.year,
    input.month,
  );

  const walletMonth = await db.walletMonth.findUnique({
    where: {
      budgetMonthId_walletId: {
        budgetMonthId: budgetMonth.id,
        walletId: input.walletId,
      },
    },
  });

  if (!walletMonth) {
    throw new Error("Wallet not found for this month");
  }

  return db.walletMonth.update({
    where: { id: walletMonth.id },
    data: {
      ...(input.openingBalance !== undefined
        ? { openingBalance: input.openingBalance }
        : {}),
      ...(input.addedAmount !== undefined
        ? { addedAmount: input.addedAmount }
        : {}),
    },
  });
}

export async function addWalletFunds(input: {
  userId: string;
  year: number;
  month: number;
  walletId: string;
  amount: number;
  note?: string;
}) {
  if (input.amount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  const budgetMonth = await ensureBudgetMonth(
    input.userId,
    input.year,
    input.month,
  );

  const wallet = await db.wallet.findFirst({
    where: { id: input.walletId, userId: input.userId, isActive: true },
  });

  if (!wallet) {
    throw new Error("Wallet not found or inactive");
  }

  const existing = await db.walletMonth.findUnique({
    where: {
      budgetMonthId_walletId: {
        budgetMonthId: budgetMonth.id,
        walletId: input.walletId,
      },
    },
  });

  if (!existing) {
    return db.walletMonth.create({
      data: {
        budgetMonthId: budgetMonth.id,
        walletId: input.walletId,
        openingBalance: 0,
        addedAmount: input.amount,
      },
    });
  }

  const currentAdded = toNumber(existing.addedAmount);
  return db.walletMonth.update({
    where: { id: existing.id },
    data: { addedAmount: currentAdded + input.amount },
  });
}

export async function updateCategoryBudget(input: {
  userId: string;
  year: number;
  month: number;
  categoryId: string;
  budgetAmount?: number;
  complete?: boolean;
}) {
  const budgetMonth = await ensureBudgetMonth(
    input.userId,
    input.year,
    input.month,
  );

  const category = await db.category.findFirst({
    where: { id: input.categoryId, userId: input.userId },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  let budgetAmount = input.budgetAmount;

  if (input.complete) {
    budgetAmount = await getCategorySpent(budgetMonth.id, input.categoryId);
  }

  if (budgetAmount === undefined) {
    throw new Error("Budget amount is required");
  }

  if (budgetAmount < 0) {
    throw new Error("Budget amount cannot be negative");
  }

  return db.categoryBudget.upsert({
    where: {
      budgetMonthId_categoryId: {
        budgetMonthId: budgetMonth.id,
        categoryId: input.categoryId,
      },
    },
    update: { budgetAmount },
    create: {
      budgetMonthId: budgetMonth.id,
      categoryId: input.categoryId,
      budgetAmount,
    },
  });
}

export async function setRolloverEnabled(
  userId: string,
  year: number,
  month: number,
  enabled: boolean,
) {
  const budgetMonth = await ensureBudgetMonth(userId, year, month);
  return db.budgetMonth.update({
    where: { id: budgetMonth.id },
    data: { rolloverEnabled: enabled },
  });
}

export async function moveBudgetMonth(
  userId: string,
  fromYear: number,
  fromMonth: number,
  toYear: number,
  toMonth: number,
  options?: { replaceExisting?: boolean },
) {
  if (fromYear === toYear && fromMonth === toMonth) {
    throw new Error("Choose a different month");
  }

  const source = await db.budgetMonth.findUnique({
    where: {
      userId_year_month: { userId, year: fromYear, month: fromMonth },
    },
  });

  if (!source) {
    throw new Error("No budget found for the selected month");
  }

  const target = await db.budgetMonth.findUnique({
    where: {
      userId_year_month: { userId, year: toYear, month: toMonth },
    },
    include: {
      _count: { select: { transactions: true } },
    },
  });

  if (target) {
    if (!options?.replaceExisting) {
      throw new Error(
        "That month already has a budget. Confirm replace to overwrite it.",
      );
    }

    if (target._count.transactions > 0) {
      throw new Error(
        "That month already has transactions. Move or delete them first.",
      );
    }

    await db.budgetMonth.delete({ where: { id: target.id } });
  }

  return db.budgetMonth.update({
    where: { id: source.id },
    data: { year: toYear, month: toMonth },
  });
}

export async function resetBudgetMonthToZero(
  userId: string,
  year: number,
  month: number,
) {
  const budgetMonth = await ensureBudgetMonth(userId, year, month);

  const wallets = await db.wallet.findMany({
    where: { userId, isActive: true },
    include: { categories: { orderBy: { sortOrder: "asc" } } },
  });

  // Batch updates only — interactive $transaction callbacks fail on Neon pooler.
  await db.$transaction([
    db.walletMonth.updateMany({
      where: { budgetMonthId: budgetMonth.id },
      data: { openingBalance: 0, addedAmount: 0 },
    }),
    db.categoryBudget.updateMany({
      where: { budgetMonthId: budgetMonth.id },
      data: { budgetAmount: 0 },
    }),
  ]);

  for (const wallet of wallets) {
    await db.walletMonth.upsert({
      where: {
        budgetMonthId_walletId: {
          budgetMonthId: budgetMonth.id,
          walletId: wallet.id,
        },
      },
      update: { openingBalance: 0, addedAmount: 0 },
      create: {
        budgetMonthId: budgetMonth.id,
        walletId: wallet.id,
        openingBalance: 0,
        addedAmount: 0,
      },
    });

    for (const category of wallet.categories) {
      await db.categoryBudget.upsert({
        where: {
          budgetMonthId_categoryId: {
            budgetMonthId: budgetMonth.id,
            categoryId: category.id,
          },
        },
        update: { budgetAmount: 0 },
        create: {
          budgetMonthId: budgetMonth.id,
          categoryId: category.id,
          budgetAmount: 0,
        },
      });
    }
  }

  return budgetMonth;
}

export async function createCategory(input: {
  userId: string;
  walletId: string;
  name: string;
  year: number;
  month: number;
  budgetAmount?: number;
}) {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Category name is required");
  }

  const wallet = await db.wallet.findFirst({
    where: { id: input.walletId, userId: input.userId },
  });

  if (!wallet) {
    throw new Error("Wallet not found");
  }

  const existing = await db.category.findFirst({
    where: {
      userId: input.userId,
      walletId: input.walletId,
      name,
    },
  });

  if (existing) {
    throw new Error("This category already exists for the selected wallet");
  }

  const maxSort = await db.category.aggregate({
    where: { walletId: input.walletId },
    _max: { sortOrder: true },
  });

  const budgetMonth = await ensureBudgetMonth(
    input.userId,
    input.year,
    input.month,
  );

  const category = await db.category.create({
    data: {
      userId: input.userId,
      walletId: input.walletId,
      name,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });

  await db.categoryBudget.create({
    data: {
      budgetMonthId: budgetMonth.id,
      categoryId: category.id,
      budgetAmount: input.budgetAmount ?? 0,
    },
  });

  return category;
}
