"use client";

import { useState } from "react";
import { apiClient } from "@/lib/apiClient";

export default function ApiKeySection() {
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    setLoading(true);
    setError("");
    setGeneratedKey(null);

    try {
      const response = await apiClient.auth.createApiKey();
      if (!response.success) {
        setError(response.error || "Impossible de générer la clé API.");
        return;
      }
      setGeneratedKey(response.data.apiKey);
    } catch {
      setError("Impossible de se connecter au serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 border-t border-border pt-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Clé API</p>
          <p className="mt-1 text-xs leading-snug text-muted-foreground">
            Générez une clé pour l&apos;API publique (en-tête{" "}
            <code className="text-[11px]">Authorization: Bearer …</code>).
            <br />
            La clé n&apos;est affichée qu&apos;une seule fois : enregistrez-la
            immédiatement.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="btn-nav shrink-0 disabled:opacity-50"
        >
          {loading ? "Génération…" : "Générer une clé API"}
        </button>
      </div>

      {error ? <p className="mt-3 form-error">{error}</p> : null}

      {generatedKey ? (
        <div className="mt-4 rounded-none border border-border bg-muted/30 p-3">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Copiez cette clé maintenant
          </p>
          <p className="mt-2 break-all font-mono text-sm">{generatedKey}</p>
        </div>
      ) : null}
    </div>
  );
}
