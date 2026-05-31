import { NextResponse } from "next/server";
import { z } from "zod";
import { completeOnboarding } from "@/lib/budget";
import { createSession, requireSession } from "@/lib/session";

const schema = z.object({
  wallets: z
    .array(
      z.object({
        providerKey: z.string().min(1),
        openingBalance: z.number().min(0),
      }),
    )
    .min(1),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = schema.parse(await request.json());

    await completeOnboarding(session.userId, body.wallets);
    await createSession({
      userId: session.userId,
      email: session.email,
      onboardingCompleted: true,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
