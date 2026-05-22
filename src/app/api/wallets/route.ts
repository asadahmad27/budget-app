import { NextResponse } from "next/server";
import { z } from "zod";
import {
  addAllMissingWallets,
  addWalletFromCatalog,
  getWalletCatalogForUser,
} from "@/lib/budget";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const catalog = await getWalletCatalogForUser(session.userId);
  return NextResponse.json({ catalog });
}

const schema = z.object({
  providerKey: z.string().min(1).optional(),
  addAllMissing: z.boolean().optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = schema.parse(await request.json());

    if (body.addAllMissing) {
      const wallets = await addAllMissingWallets(session.userId);
      return NextResponse.json({ addedCount: wallets.length });
    }

    if (!body.providerKey) {
      return NextResponse.json(
        { error: "providerKey is required" },
        { status: 400 },
      );
    }

    const wallet = await addWalletFromCatalog(
      session.userId,
      body.providerKey,
    );

    return NextResponse.json({
      wallet: {
        id: wallet.id,
        name: wallet.name,
        color: wallet.color,
        providerKey: wallet.providerKey,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to add wallet";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
