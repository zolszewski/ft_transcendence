
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { Article } from "@/lib/types"
import ArticleSection from "./components/articleSection";
import { apiClient } from "@/lib/apiClient";

export default function DashboardForm() {
  const [drafts, setDrafts] = useState<Article[]>([]);
  const [submitted, setSubmitted] = useState<Article[]>([]);
  const [published, setPublished] = useState<Article[]>([]);
  const [rejected, setRejected] = useState<Article[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const response = await apiClient.dashboard.mine({ });
        if (!response.success) {
          throw new Error(response.error); }
        const articles = response.data.data;
        
        setDrafts(articles.filter((article) => article.status == "DRAFT"));
        setSubmitted(articles.filter((article) => article.status == "SUBMITTED"));
        setPublished(articles.filter((article) => article.status == "PUBLISHED"));
        setRejected(articles.filter((article) => article.status == "REJECTED"));

      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load dashboard"
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

  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between border-b p-4">
        <Link
          href="/"
          className="border px-4 py-2 hover:underline"
        >
          Home
        </Link>

        <h1 className="text-xl font-bold">
          My Dashboard
        </h1>

        <LogoutButton />
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8">

        {error && (
          <p className="mb-6 text-red-500">
            {error}
          </p>
        )}

        <ArticleSection
          title="Drafts"
          articles={drafts}
        />

        <ArticleSection
          title="Submitted"
          articles={submitted}
        />


        <ArticleSection
          title="Published"
          articles={published}
        />

        <ArticleSection
          title="Rejected"
          articles={rejected}
        />

      </div>
    </main>
  );
}