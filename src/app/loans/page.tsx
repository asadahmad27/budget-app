import { AddLoanForm } from "@/components/add-loan-form";
import { AppShell } from "@/components/app-shell";
import { LoanList } from "@/components/loan-list";
import { getLoans } from "@/lib/loans";
import { getSession } from "@/lib/session";

export default async function LoansPage() {
  const session = await getSession();
  if (!session) return null;

  const { loans, summary } = await getLoans(session.userId);

  return (
    <AppShell title="Loans" showFab={false}>
      <div className="mx-auto max-w-2xl space-y-6 pb-8">
        <AddLoanForm />
        <LoanList loans={loans} summary={summary} />
      </div>
    </AppShell>
  );
}
