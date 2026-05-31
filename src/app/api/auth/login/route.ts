import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyUser } from "@/lib/auth";
import { createSession } from "@/lib/session";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const user = await verifyUser(body.email, body.password);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    await createSession({
      userId: user.id,
      email: user.email,
      onboardingCompleted: user.onboardingCompleted,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
