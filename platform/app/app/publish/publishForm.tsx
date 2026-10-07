"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import PageShell from "@/components/PageShell";
import AppHeader from "@/components/AppHeader";
import NavLink from "@/components/NavLink";
import PageHeading from "@/components/PageHeading";
import TextEditor from "@/components/text-editor";
import type { TextEditorHandle } from "@/components/text-editor";
import UploadProgress from "@/components/uploadProgress";
import { apiClient } from "@/lib/apiClient";
import {
  getArticleMiniatureFocus,
  getArticleMiniatureUrl,
  getArticlePdfUrl,
  hasStoredMiniature,
  hasStoredPdf,
} from "@/lib/articleUtils";
import ErrorPage from "@/components/ErrorPage";

export default function PublishForm() {
  const draftStorageKey = "publish-form-draft";
  const router = useRouter();
  const searchParams = useSearchParams();
  const editorRef = useRef<TextEditorHandle>(null);
  const draftId = searchParams.get("draft");
  const [savedData, setSavedData] = useState({ title: "", content: "" });
  const [initialImageUrl, setInitialImageUrl] = useState<string | undefined>();
  const [initialPdfUrl, setInitialPdfUrl] = useState<string | undefined>();
  const [initialMiniatureFocus, setInitialMiniatureFocus] = useState<
    { x: number; y: number } | undefined
  >();
  const [pageError, setPageError] = useState("");
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  useEffect(() => {
    if (draftId) {
      apiClient.articles.getDraft(draftId).then((response) => {
        if (!response.success) {
          setError(response.error);
          setErrorStatus(response.status);
          return;
        }
        const draft = response.data;
        setSavedData({
          title: draft.title,
          content: draft.content,
        });
        setInitialImageUrl(
          hasStoredMiniature(draft)
            ? (getArticleMiniatureUrl(draft) ?? undefined)
            : undefined,
        );
        setInitialPdfUrl(
          hasStoredPdf(draft) ? (getArticlePdfUrl(draft) ?? undefined) : undefined,
        );
        setInitialMiniatureFocus(
          hasStoredMiniature(draft) ? getArticleMiniatureFocus(draft) : undefined,
        );
      });
      return;
    }
    setInitialImageUrl(undefined);
    setInitialPdfUrl(undefined);
    setInitialMiniatureFocus(undefined);
    try {
      const storedData = sessionStorage.getItem(draftStorageKey);
      if (storedData) setSavedData(JSON.parse(storedData));
    } catch {
      sessionStorage.removeItem(draftStorageKey);
    }
  }, [draftId]);

  function cacheData(data: { title: string; content: string }) {
    setSavedData(data);
    sessionStorage.setItem(draftStorageKey, JSON.stringify(data));
  }

  function clearCachedData() {
    sessionStorage.removeItem(draftStorageKey);
  }

  async function persistDraft(allowEmpty = false) {
    setPageError("");

    const editorData = editorRef.current?.getData() ?? { title: "", content: "" };
    const miniatureFile = editorRef.current?.image ?? null;
    const pdfFile = editorRef.current?.pdf ?? null;
    const pdfRemoved = editorRef.current?.pdfRemoved ?? false;
    const { title, content } = editorData;
    const miniatureFocus = editorRef.current?.getMiniatureFocus() ?? { x: 50, y: 50 };

    if (!title) {
      if (allowEmpty) return true;
      setPageError("Ajoutez un titre avant d'enregistrer le brouillon.");
      return false;
    }
    if (!content) {
      if (allowEmpty) return true;
      setPageError("Rédigez du contenu avant d'enregistrer le brouillon.");
      return false;
    }

    setLoading(true);
    if (miniatureFile || pdfFile) setUploadProgress(0);
    try {
      const response = draftId
        ? await apiClient.articles.update(
            draftId,
            title,
            content,
            miniatureFile,
            undefined,
            pdfFile,
            pdfRemoved,
            miniatureFocus,
            setUploadProgress,
          )
        : await apiClient.articles.create(
            title,
            content,
            miniatureFile,
            undefined,
            pdfFile,
            miniatureFocus,
            setUploadProgress,
          );
      if (response.success === false) {
        setError(response.error);
        setErrorStatus(response.status || null);
        return false;
      }
      clearCachedData();
      if (!draftId && response.success && "data" in response) {
        router.replace(`/publish?draft=${response.data.id}`);
      }
      return true;
    } catch {
      setError("Impossible de se connecter au serveur.");
      return false;
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  }

  async function saveDraft() {
    if (await persistDraft()) {
      router.push("/");
      router.refresh();
    }
  }

  async function handleHomeClick(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (await persistDraft(true)) {
      router.push("/");
      router.refresh();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPageError("");

    const editorData = editorRef.current?.getData() ?? { title: "", content: "" };
    const miniatureFile = editorRef.current?.image ?? null;
    const pdfFile = editorRef.current?.pdf ?? null;
    const pdfRemoved = editorRef.current?.pdfRemoved ?? false;
    const { title, content } = editorData;
    const miniatureFocus = editorRef.current?.getMiniatureFocus() ?? { x: 50, y: 50 };

    if (!title) {
      setPageError("Ajoutez un titre avant de continuer.");
      return;
    }
    if (!content) {
      setPageError("Rédigez du contenu avant de continuer.");
      return;
    }
    setLoading(true);
    if (miniatureFile || pdfFile) setUploadProgress(0);

    try {
      const createResponse = draftId
        ? await apiClient.articles.update(
            draftId,
            title,
            content,
            miniatureFile,
            undefined,
            pdfFile,
            pdfRemoved,
            miniatureFocus,
            setUploadProgress,
          )
        : await apiClient.articles.create(
            title,
            content,
            miniatureFile,
            undefined,
            pdfFile,
            miniatureFocus,
            setUploadProgress,
          );
      if (!createResponse.success) {
        setError(createResponse.error);
        setErrorStatus(createResponse.status || null);
        return;
      }
      const article = createResponse.data;

      const submitResponse = await apiClient.articles.submit(article.id);
      if (!submitResponse.success) {
        setError("Article was saved, but submitting for review failed: " + submitResponse.error);
        setErrorStatus(submitResponse.status || null);
        return;
      }

      clearCachedData();
      const redirectTo = searchParams.get("redirect") || "/";
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Impossible de se connecter au serveur.");
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  }

  if (error) {
    return <ErrorPage statusCode={errorStatus ?? 500} message={error} />;
  }

  return (
    <PageShell
      width="narrow"
      offset="lg"
      header={
        <AppHeader
          left={
            <div className="flex gap-2">
              <NavLink href="/" onClick={handleHomeClick}>
                Accueil
              </NavLink>
              <NavLink href="/drafts">Brouillons</NavLink>
            </div>
          }
          right={<LogoutButton beforeLogout={() => persistDraft(true)} />}
        />
      }
    >
      <PageHeading title="Publier" description="Soumettez votre travail académique pour relecture." />

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <TextEditor
          ref={editorRef}
          initialData={savedData}
          initialImageUrl={initialImageUrl}
          initialPdfUrl={initialPdfUrl}
          initialMiniatureFocus={initialMiniatureFocus}
          onChange={cacheData}
          onImageUpload={async (file) => {
            const response = await apiClient.uploads.image(file);
            return response.success ? response.data.url : null;
          }}
        />

        <UploadProgress percent={uploadProgress} />

        {pageError ? <p className="form-error">{pageError}</p> : null}

        <button type="submit" disabled={loading} className="btn-action-full py-3 font-bold">
          {loading ? "Envoi…" : "Soumettre pour relecture"}
        </button>
        <button type="button" onClick={saveDraft} disabled={loading} className="btn-action-full py-3 font-bold">
          Enregistrer comme brouillon
        </button>
      </form>
    </PageShell>
  );
}