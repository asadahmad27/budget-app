"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Unable to create account");
      return;
    }

    router.push("/onboarding");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Create account" },
          ]}
        />
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-8 shadow-md">
        <h1 className="text-2xl font-bold text-primary">Create account</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Set up Pakistani mobile wallets and banks for your first month.
        </p>

        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className="w-full rounded-lg border border-outline-variant bg-white px-4 py-3 outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-outline-variant bg-white px-4 py-3 outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                className="w-full rounded-lg border border-outline-variant bg-white px-4 py-3 pr-12 outline-none focus:border-primary"
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
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-on-primary disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-on-surface-variant">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-secondary">
            Sign in
          </Link>
        </p>
        </div>
      </div>
    </div>
  );
}
