import { NextResponse } from "next/server";
import { z } from "zod";
import { createLoan, getLoans } from "@/lib/loans";
import { parseTransactionDate } from "@/lib/format";
import { getSession } from "@/lib/session";

const directionSchema = z.enum(["given", "taken"]);

const createSchema = z.object({
  direction: directionSchema,
  personName: z.string().min(1),
  amount: z.number().positive(),
  repaidAmount: z.number().min(0).optional(),
  note: z.string().optional(),
  date: z.string().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await getLoans(session.userId);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = createSchema.parse(await request.json());
    const loan = await createLoan({
      userId: session.userId,
      direction: body.direction,
      personName: body.personName,
      amount: body.amount,
      repaidAmount: body.repaidAmount,
      note: body.note,
      date: body.date ? parseTransactionDate(body.date) : undefined,
    });
    return NextResponse.json({ ok: true, loan });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create loan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
