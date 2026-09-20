"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";

type LogoutButtonProps = {
  beforeLogout?: () => Promise<boolean>;
};

export default function LogoutButton({ beforeLogout }: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    try {
      if (beforeLogout && !(await beforeLogout())) return;
      const response = await apiClient.auth.logout();

      if (response.success  ) {
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