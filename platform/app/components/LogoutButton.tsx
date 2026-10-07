"use client";

import { useState } from "react";
import { apiClient } from "@/lib/apiClient";

type LogoutButtonProps = {
  beforeLogout?: () => Promise<boolean>;
};

export default function LogoutButton({ beforeLogout }: LogoutButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    try {
      if (beforeLogout && !(await beforeLogout())) return;
      const response = await apiClient.auth.logout();

      if (response.success) {
        //full reload (not router.replace) to wipe all browser state
        //(socket, DiscussionProvider, router cache), otherwise the old user can stick around
        window.location.replace("/");
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
      className="btn-nav"
    >
      {loading ? "Déconnexion…" : "Se déconnecter"}
    </button>
  );
}