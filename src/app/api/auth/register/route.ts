import { NextResponse } from "next/server";
import { z } from "zod";
import { registerUser } from "@/lib/auth";
import { createSession } from "@/lib/session";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const user = await registerUser(body);
    await createSession({
      userId: user.id,
      email: user.email,
      onboardingCompleted: false,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to register";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
