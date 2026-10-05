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
        // rechargement complet (pas router.replace) : remet à zéro tout l'état du navigateur
        // (socket, ChatProvider, cache du router), sinon l'ancien utilisateur peut rester en mémoire
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
      {loading ? "Logging out..." : "Log out"}
    </button>
  );
}