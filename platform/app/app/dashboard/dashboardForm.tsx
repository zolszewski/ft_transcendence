"use client";

import { useEffect, useState } from "react";
import LogoutButton from "@/components/LogoutButton";
import { Article, User, DashboardStats } from "@/lib/types";
import ArticleSection from "@/components/articleSection";
import { apiClient } from "@/lib/apiClient";
import ErrorPage from "@/components/ErrorPage";
import PageShell from "@/components/PageShell";
import AppHeader from "@/components/AppHeader";
import NavLink from "@/components/NavLink";
import DashboardTabs, { type DashboardTab } from "@/components/DashboardTabs";
import UserProfileSection from "@/components/UserProfileSection";
import StatsSection from "@/components/StatsSection";

export default function DashboardForm() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [drafts, setDrafts] = useState<Article[]>([]);
  const [submitted, setSubmitted] = useState<Article[]>([]);
  const [published, setPublished] = useState<Article[]>([]);
  const [rejected, setRejected] = useState<Article[]>([]);
  const [activeTab, setActiveTab] = useState<DashboardTab>("articles");
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const [userResponse, dashboardResponse, statsResponse] = await Promise.all([
          apiClient.auth.me(),
          apiClient.dashboard.mine({}),
          apiClient.dashboard.stats(),
        ]);

        if (!userResponse.success) {
          setError(userResponse.error || "Impossible de charger le profil utilisateur.");
          setErrorStatus(userResponse.status || null);
          return;
        }

        if (!dashboardResponse.success) {
          setError(dashboardResponse.error || "Impossible de charger le tableau de bord.");
          setErrorStatus(dashboardResponse.status || null);
          return;
        }

        if (!statsResponse.success) {
          setError(statsResponse.error || "Impossible de charger les statistiques du tableau de bord.");
          setErrorStatus(statsResponse.status || null);
          return;
        }

        setUser(userResponse.data);
        setStats(statsResponse.data);

        const articles = dashboardResponse.data.data;
        setDrafts(articles.filter((article) => article.status === "DRAFT"));
        setSubmitted(articles.filter((article) => article.status === "SUBMITTED"));
        setPublished(articles.filter((article) => article.status === "PUBLISHED"));
        setRejected(articles.filter((article) => article.status === "REJECTED"));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Impossible de charger le tableau de bord",
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return <p className="p-8">Chargement…</p>;
  }
  if (error) {
    return <ErrorPage statusCode={errorStatus ?? 500} message={error} />;
  }

  return (
    <PageShell
      variant="dashboard"
      header={
        <AppHeader
          variant="bordered"
          left={<NavLink href="/">Accueil</NavLink>}
          center={<h1 className="text-xl font-bold">Mon tableau de bord</h1>}
          right={
            <div className="flex items-center gap-2">
              <NavLink href="/friends">Amis</NavLink>
              <LogoutButton />
            </div>
          }
        />
      }
    >
      {user ? (
        <UserProfileSection
          user={user}
          isOwner={true}
          onUserUpdated={(updated) => setUser(updated)}
        />
      ) : null}

      <DashboardTabs active={activeTab} onChange={setActiveTab} />

      {activeTab === "information" ? (
        stats ? (
          <StatsSection stats={stats} />
        ) : (
          <p className="p-4 text-sm text-gray-500">Aucune statistique disponible.</p>
        )
      ) : null}

      {activeTab === "articles" ? (
        <>
          <ArticleSection title="Brouillons" articles={drafts} />
          <ArticleSection title="En attente de validation" articles={submitted} />
          <ArticleSection title="Publiés" articles={published} />
          <ArticleSection title="Rejetés" articles={rejected} />
        </>
      ) : null}
    </PageShell>
  );
}