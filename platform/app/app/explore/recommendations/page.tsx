"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import { apiClient } from "@/lib/apiClient";
import type { Article } from "@/lib/types";
import ErrorPage from "@/components/ErrorPage";
import PageShell from "@/components/PageShell";
import AppHeader from "@/components/AppHeader";
import NavLink from "@/components/NavLink";
import ArticleCarouselSection from "@/components/ArticleCarouselSection";

export default function MyRecommendationsPage() {
  const router = useRouter();

  const [discover, setDiscover] = useState<Article[]>([]);
  const [deepen, setDeepen] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [discoverResponse, deepenResponse] = await Promise.all([
          apiClient.articles.discover(),
          apiClient.articles.deepen(),
        ]);

        if (!discoverResponse.success) {
          if (discoverResponse.status === 401) {
            router.push(`/authentication/login?redirect=${encodeURIComponent("/explore/recommendations")}`);
            return;
          }
          setError(discoverResponse.error || "Unable to load recommendations.");
          setErrorStatus(discoverResponse.status);
          return;
        }
        setDiscover(discoverResponse.data);

        if (deepenResponse.success) setDeepen(deepenResponse.data);
      } catch {
        setError("Unable to connect to the server.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  if (error) {
    return <ErrorPage statusCode={errorStatus ?? 500} message={error} />;
  }

  return (
    <PageShell
      width="default"
      offset="sm"
      header={
        <AppHeader
          left={<NavLink href="/explore">Back to explore</NavLink>}
          right={<LogoutButton />}
        />
      }
    >
      <h1 className="mb-6 text-2xl font-bold">My Recommendations</h1>

      {loading ? <p className="text-sm">Loading...</p> : null}

      {!loading && discover.length === 0 && deepen.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Engage with a few articles (view, like, comment, review) to get personalized recommendations.
        </p>
      ) : null}

      {!loading && discover.length > 0 ? (
        <ArticleCarouselSection
          title="Discover"
          articles={discover}
          getArticleHref={(article) => `/explore/${article.id}`}
        />
      ) : null}

      {!loading && deepen.length > 0 ? (
        <ArticleCarouselSection
          title="Deepen your knowledge"
          articles={deepen}
          getArticleHref={(article) => `/explore/${article.id}`}
        />
      ) : null}
    </PageShell>
  );
}