"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/apiClient";
import type { Article } from "@/lib/types";
import ErrorPage from "@/components/ErrorPage";
import PageShell from "@/components/PageShell";
import AppHeader from "@/components/AppHeader";
import NavLink from "@/components/NavLink";
import PageHeading from "@/components/PageHeading";
import { Card } from "@/components/ui/card";


export default function DraftsPage() {
  const [drafts, setDrafts] = useState<Article[]>([]);
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  useEffect(() => {
    apiClient.dashboard.mine({status: "DRAFT"}).then((response) => {
      if (!response.success) {
        setError(response.error);
        setErrorStatus(response.status || null);
        return;
      }
      setDrafts(response.data);
    });
  }, []);
  if (error)
    return <ErrorPage statusCode={errorStatus ?? 500} message={error} />;
  return (
    <PageShell
      variant="dashboard"
      containerClassName="max-w-2xl py-12"
      header={
        <AppHeader
          variant="bordered"
          left={<PageHeading title="Drafts" />}
          right={<NavLink href="/publish">Publish</NavLink>}
        />
      }
    >
      {!error && drafts.length === 0 && (
        <p className="text-sm text-muted-foreground">You have no drafts yet.</p>
      )}
      <ul className="mt-8 space-y-3">
        {drafts.map((draft) => (
          <li key={draft.id}>
            <Card className="p-4">
              <Link
                href={`/publish?draft=${draft.id}`}
                className="font-bold hover:underline"
              >
                {draft.title}
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">
                Edited on {new Date(draft.updatedAt).toLocaleDateString()}
              </p>
            </Card>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}