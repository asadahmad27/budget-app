import { NextResponse } from "next/server";
import { z } from "zod";
import { createTransaction, createTransactions } from "@/lib/budget";
import { parseTransactionDate } from "@/lib/format";
import { getSession } from "@/lib/session";

const entrySchema = z.object({
  walletId: z.string().min(1),
  categoryId: z.string().min(1).optional(),
  amount: z.number().positive(),
  description: z.string().optional(),
});

const loanSchema = z.object({
  action: z.enum(["sent", "received"]),
  loanId: z.string().min(1).optional(),
  personName: z.string().min(1).optional(),
  direction: z.enum(["given", "taken"]).optional(),
});

const singleSchema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  walletId: z.string().min(1),
  categoryId: z.string().min(1).optional(),
  amount: z.number().positive(),
  description: z.string().optional(),
  date: z.string().optional(),
  loan: loanSchema.optional(),
});

const batchSchema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  date: z.string(),
  entries: z.array(entrySchema).min(1).max(30),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: unknown = await request.json();

    if (
      body &&
      typeof body === "object" &&
      "entries" in body &&
      Array.isArray((body as { entries: unknown }).entries)
    ) {
      const parsed = batchSchema.parse(body);
      const created = await createTransactions(
        session.userId,
        parsed.year,
        parsed.month,
        parseTransactionDate(parsed.date),
        parsed.entries,
      );
      return NextResponse.json({ ok: true, count: created.length });
    }

    const parsed = singleSchema.parse(body);
    const { date: dateValue, ...rest } = parsed;
    await createTransaction({
      userId: session.userId,
      ...rest,
      date: dateValue ? parseTransactionDate(dateValue) : undefined,
    });
    return NextResponse.json({ ok: true, count: 1 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create transaction";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
