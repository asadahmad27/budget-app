"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RolloverToggle({
  year,
  month,
  enabled,
}: {
  year: number;
  month: number;
  enabled: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(enabled);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const next = !value;
    const response = await fetch("/api/settings/rollover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, month, enabled: next }),
    });
    setLoading(false);

    if (response.ok) {
      setValue(next);
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={`mt-4 flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium ${
        value ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container-low"
      }`}
    >
      <span className="material-symbols-outlined">
        {value ? "toggle_on" : "toggle_off"}
      </span>
      {value ? "Rollover enabled" : "Rollover disabled"}
    </button>
  );
}
