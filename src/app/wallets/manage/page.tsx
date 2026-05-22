import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { WalletCatalogPicker } from "@/components/wallet-catalog-picker";
import { getWalletCatalogForUser } from "@/lib/budget";
import { parsePeriod } from "@/lib/format";
import { getSession } from "@/lib/session";

export default async function ManageWalletsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const params = await searchParams;
  const period = parsePeriod(params);
  const catalog = await getWalletCatalogForUser(session.userId);

  return (
    <AppShell
      title="Add Wallets"
      showFab={false}
      breadcrumbs={[
        { label: "Home", href: `/dashboard?year=${period.year}&month=${period.month}` },
        { label: "Wallets", href: `/wallets?year=${period.year}&month=${period.month}` },
        { label: "Add Wallets" },
      ]}
    >
      <WalletCatalogPicker
        catalog={catalog}
        year={period.year}
        month={period.month}
      />
    </AppShell>
  );
}
