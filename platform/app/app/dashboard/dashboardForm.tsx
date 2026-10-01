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
          setError(userResponse.error || "Unable to load user profile.");
          setErrorStatus(userResponse.status || null);
          return;
        }

        if (!dashboardResponse.success) {
          setError(dashboardResponse.error || "Unable to load dashboard.");
          setErrorStatus(dashboardResponse.status || null);
          return;
        }

        if (!statsResponse.success) {
          setError(statsResponse.error || "Unable to load dashboard stats.");
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
          err instanceof Error ? err.message : "Failed to load dashboard",
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return <p className="p-8">Loading...</p>;
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
          left={<NavLink href="/">Home</NavLink>}
          center={<h1 className="text-xl font-bold">My Dashboard</h1>}
          right={
            <div className="flex items-center gap-2">
              <NavLink href="/friends">Friends</NavLink>
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
          <p className="p-4 text-sm text-gray-500">No statistics available.</p>
        )
      ) : null}

      {activeTab === "articles" ? (
        <>
          <ArticleSection title="Drafts" articles={drafts} />
          <ArticleSection title="Submitted" articles={submitted} />
          <ArticleSection title="Published" articles={published} />
          <ArticleSection title="Rejected" articles={rejected} />
        </>
      ) : null}
    </PageShell>
  );
}