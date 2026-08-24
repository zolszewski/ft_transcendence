"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    try {
      const response = await apiFetch("/auth/logout", { method: "POST" });

      if (response.ok) {
        router.replace("/");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="border px-4 py-2 disabled:opacity-50"
    >
      {loading ? "Logging out..." : "Log out"}
    </button>
  );
}