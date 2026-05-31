import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteLoan, updateLoan } from "@/lib/loans";
import { getSession } from "@/lib/session";

const updateSchema = z.object({
  personName: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  repaidAmount: z.number().min(0).optional(),
  note: z.string().optional(),
  date: z.string().optional(),
  settled: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = updateSchema.parse(await request.json());
    const loan = await updateLoan(session.userId, id, body);
    return NextResponse.json({ ok: true, loan });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update loan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    await deleteLoan(session.userId, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete loan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
