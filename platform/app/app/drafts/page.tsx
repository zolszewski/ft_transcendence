"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/apiClient";
import type { Article } from "@/lib/types";
import ErrorPage from "@/components/ErrorPage";


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
    <main className="mx-auto min-h-screen w-full max-w-2xl px-4 py-12">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Drafts</h1>
        <Link href="/publish" className="border px-4 py-2 hover:underline">
          Publish
        </Link>
      </header>
      {!error && drafts.length === 0 && (
        <p className="mt-8 text-sm text-gray-600">You have no drafts yet.</p>
      )}
      <ul className="mt-8 space-y-3">
        {drafts.map((draft) => (
          <li key={draft.id} className="border p-4">
            <Link href={`/publish?draft=${draft.id}`} className="font-bold hover:underline">
              {draft.title}
            </Link>
            <p className="mt-1 text-sm text-gray-600">
              Edited on {new Date(draft.updatedAt).toLocaleDateString()}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}