"use client";

import { useEffect, useState } from "react";
import type { User } from "@/lib/types";
import { apiClient } from "@/lib/apiClient";
import ErrorPage from "@/components/ErrorPage";
import PageShell from "@/components/PageShell";
import AppHeader from "@/components/AppHeader";
import NavLink from "@/components/NavLink";
import LogoutButton from "@/components/LogoutButton";
import FriendsManager from "@/components/FriendsManager";

export default function FriendsPageClient() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.auth.me().then((response) => {
      if (!response.success) {
        setError(response.error || "Unable to load your account.");
        setLoading(false);
        return;
      }
      setUser(response.data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <p className="p-8">Loading...</p>;
  }
  if (error || !user) {
    return <ErrorPage statusCode={401} message={error || "Not signed in"} />;
  }

  return (
    <PageShell
      variant="dashboard"
      header={
        <AppHeader
          variant="bordered"
          left={<NavLink href="/dashboard">Dashboard</NavLink>}
          center={<h1 className="text-xl font-bold">Friends</h1>}
          right={<LogoutButton />}
        />
      }
    >
      <FriendsManager currentUser={user} />
    </PageShell>
  );
}
