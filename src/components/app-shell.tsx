import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/breadcrumbs";

export function AppShell({
  children,
  title,
  header,
  breadcrumbs,
  showFab = true,
}: {
  children: React.ReactNode;
  title?: string;
  header?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  showFab?: boolean;
}) {
  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-50 bg-surface">
        <div className="mx-auto flex h-16 w-full max-w-[var(--spacing-container-max-width)] items-center justify-between px-[var(--spacing-margin-mobile)] py-2">
          {header ?? (
            <h1 className="text-lg font-bold text-primary">{title}</h1>
          )}
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="rounded-full px-3 py-2 text-sm text-on-surface-variant hover:bg-surface-container-low"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-[var(--spacing-container-max-width)] px-[var(--spacing-margin-mobile)] pt-4">
        {breadcrumbs ? <Breadcrumbs items={breadcrumbs} /> : null}
        {children}
      </main>
      {showFab ? (
        <Link
          href="/transactions/new"
          className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg transition-all hover:scale-105 active:scale-90"
        >
          <span className="material-symbols-outlined">add</span>
        </Link>
      ) : null}
      <BottomNav />
    </div>
  );
}
