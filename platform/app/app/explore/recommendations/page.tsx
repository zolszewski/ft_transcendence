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

  const [discover, setDécouvrir] = useState<Article[]>([]);
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
          setError(discoverResponse.error || "Impossible de charger les recommandations.");
          setErrorStatus(discoverResponse.status);
          return;
        }
        setDécouvrir(discoverResponse.data);

        if (deepenResponse.success) setDeepen(deepenResponse.data);
      } catch {
        setError("Impossible de se connecter au serveur.");
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
          left={<NavLink href="/explore">Retour à l'exploration</NavLink>}
          right={<LogoutButton />}
        />
      }
    >
      <h1 className="mb-6 text-2xl font-bold">Mes recommandations</h1>

      {loading ? <p className="text-sm">Chargement…</p> : null}

      {!loading && discover.length === 0 && deepen.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Interagissez avec quelques articles (consultation, j'aime, commentaire, relecture) pour obtenir des recommandations personnalisées.
        </p>
      ) : null}

      {!loading && discover.length > 0 ? (
        <ArticleCarouselSection
          title="Découvrir"
          articles={discover}
          getArticleHref={(article) => `/explore/${article.id}`}
        />
      ) : null}

      {!loading && deepen.length > 0 ? (
        <ArticleCarouselSection
          title="Approfondir vos connaissances"
          articles={deepen}
          getArticleHref={(article) => `/explore/${article.id}`}
        />
      ) : null}
    </PageShell>
  );
}