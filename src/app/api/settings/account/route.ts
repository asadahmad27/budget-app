import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteUserAccount } from "@/lib/auth";
import { destroySession, requireSession } from "@/lib/session";

const schema = z.object({
  password: z.string().min(1),
});

export async function DELETE(request: Request) {
  try {
    const session = await requireSession();
    const body = schema.parse(await request.json());

    await deleteUserAccount(session.userId, body.password);
    await destroySession();

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }
    const message =
      error instanceof Error ? error.message : "Unable to delete account";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
