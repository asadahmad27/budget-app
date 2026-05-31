import { NextResponse } from "next/server";
import { z } from "zod";
import { addWalletFunds } from "@/lib/budget";
import { getSession } from "@/lib/session";

const schema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  walletId: z.string().min(1),
  amount: z.number().positive(),
  note: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = schema.parse(await request.json());
    await addWalletFunds({
      userId: session.userId,
      ...body,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to add funds";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
