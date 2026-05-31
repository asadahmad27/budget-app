import { redirect } from "next/navigation";
import { OnboardingWalletForm } from "@/components/onboarding-wallet-form";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { onboardingCompleted: true, name: true },
  });

  if (user?.onboardingCompleted) {
    redirect("/months");
  }

  return (
    <div className="min-h-screen bg-surface px-4 py-8">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary">
            Welcome{user?.name ? `, ${user.name}` : ""}
          </h1>
          <p className="mt-2 text-on-surface-variant">
            Set up your wallets and opening balances to start tracking your
            monthly budget.
          </p>
        </div>

        <OnboardingWalletForm />
      </div>
    </div>
  );
}
