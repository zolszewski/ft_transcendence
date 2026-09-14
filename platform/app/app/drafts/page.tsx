"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/apiClient";
import type { Article } from "@/lib/types";

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<Article[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    apiClient.articles.listDrafts().then((response) => {
      if (response.success) setDrafts(response.data);
      else setError(response.error);
    });
  }, []);

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-4 py-12">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Drafts</h1>
        <Link href="/publish" className="border px-4 py-2 hover:underline">
          Publish
        </Link>
      </header>

      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}
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