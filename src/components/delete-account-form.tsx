"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function DeleteAccountForm({ email }: { email: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const confirmed = window.confirm(
      `Delete account ${email}? This permanently removes all wallets, budgets, transactions, and loans. This cannot be undone.`,
    );

    if (!confirmed) return;

    setLoading(true);
    setError(null);

    const response = await fetch("/api/settings/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Unable to delete account");
      return;
    }

    router.push("/login");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-4">
      <p className="text-sm text-on-surface-variant">
        Permanently delete your account and all associated data. Enter your
        password to confirm.
      </p>

      <div>
        <label className="mb-2 block text-sm font-medium" htmlFor="delete-password">
          Password
        </label>
        <div className="relative">
          <input
            id="delete-password"
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-white px-4 py-3 pr-12 outline-none focus:border-error"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <span className="material-symbols-outlined text-xl">
              {showPassword ? "visibility_off" : "visibility"}
            </span>
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-error">{error}</p> : null}

      <button
        type="submit"
        disabled={loading || password.length === 0}
        className="rounded-lg border border-error bg-error px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {loading ? "Deleting account…" : "Delete account"}
      </button>
    </form>
  );
}
