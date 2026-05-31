import { AddGoalForm } from "@/components/add-goal-form";
import { AppShell } from "@/components/app-shell";
import { GoalList } from "@/components/goal-list";
import { getGoalWalletOptions, getLifeGoals } from "@/lib/goals";
import { getSession } from "@/lib/session";

export default async function GoalsPage() {
  const session = await getSession();
  if (!session) return null;

  const [{ goals, summary }, wallets] = await Promise.all([
    getLifeGoals(session.userId),
    getGoalWalletOptions(session.userId),
  ]);

  return (
    <AppShell title="Life goals" showFab={false}>
      <div className="mx-auto max-w-2xl space-y-6 pb-8">
        <AddGoalForm wallets={wallets} />
        <GoalList goals={goals} summary={summary} wallets={wallets} />
      </div>
    </AppShell>
  );
}
