"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { LoanDirection } from "@/lib/loans";
import { formatDateInputValue } from "@/lib/format";

export function AddLoanForm() {
  const router = useRouter();
  const [direction, setDirection] = useState<LoanDirection>("given");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const defaultDate = formatDateInputValue(new Date());

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const repaidRaw = String(formData.get("repaidAmount") ?? "").trim();

    const response = await fetch("/api/loans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        direction,
        personName: String(formData.get("personName") ?? ""),
        amount: Number(formData.get("amount")),
        repaidAmount: repaidRaw ? Number(repaidRaw) : 0,
        note: String(formData.get("note") ?? "").trim() || undefined,
        date: String(formData.get("date") ?? defaultDate),
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Unable to add loan");
      return;
    }

    router.refresh();
    event.currentTarget.reset();
    setDirection("given");
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6"
    >
      <h2 className="text-lg font-semibold text-primary">Add loan</h2>
      <p className="mt-1 text-sm text-on-surface-variant">
        Track money you lent to someone or borrowed from someone.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setDirection("given")}
          className={`rounded-lg border px-3 py-2 text-sm font-medium ${
            direction === "given"
              ? "border-primary bg-primary text-on-primary"
              : "border-outline-variant/40"
          }`}
        >
          I lent
        </button>
        <button
          type="button"
          onClick={() => setDirection("taken")}
          className={`rounded-lg border px-3 py-2 text-sm font-medium ${
            direction === "taken"
              ? "border-primary bg-primary text-on-primary"
              : "border-outline-variant/40"
          }`}
        >
          I borrowed
        </button>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium" htmlFor="personName">
            {direction === "given" ? "Lent to" : "Borrowed from"}
          </label>
          <input
            id="personName"
            name="personName"
            type="text"
            required
            placeholder="e.g. Ali, Ahmed"
            className="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="amount">
              Amount (PKR)
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              min="1"
              step="1"
              required
              className="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label
              className="mb-2 block text-sm font-medium"
              htmlFor="repaidAmount"
            >
              Already repaid
            </label>
            <input
              id="repaidAmount"
              name="repaidAmount"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              className="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium" htmlFor="date">
            Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={defaultDate}
            className="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium" htmlFor="note">
            Note (optional)
          </label>
          <input
            id="note"
            name="note"
            type="text"
            placeholder="Reason or details"
            className="w-full rounded-lg border border-outline-variant/40 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary disabled:opacity-60"
      >
        {loading ? "Saving..." : "Add loan"}
      </button>
    </form>
  );
}
