"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import PageShell from "@/components/PageShell";
import AppHeader from "@/components/AppHeader";
import NavLink from "@/components/NavLink";
import TextEditor from "@/components/text-editor";
import type { TextEditorHandle } from "@/components/text-editor";
import { apiClient } from "@/lib/apiClient";
import ErrorPage from "@/components/ErrorPage";


export default function PublishForm() {
  const draftStorageKey = "publish-form-draft";
  const router = useRouter();
  const searchParams = useSearchParams();
  const editorRef = useRef<TextEditorHandle>(null);
  const draftId = searchParams.get("draft");
  const [cachedFileHandle, setCachedFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [savedData, setSavedData] = useState({ title: "", content: "" });
  const [pageError, setPageError] = useState("");
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (draftId) {
      apiClient.articles.getDraft(draftId).then((response) => {
        if (!response.success) {
          setError(response.error);
          setErrorStatus(response.status);
          return;
        }
        setSavedData(response.data);
      });
      return;
    }
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
    setCachedFileHandle(null);
  }

  async function persistDraft(allowEmpty = false) {
    setError("");

    const editorData = editorRef.current?.getData() ?? {
      title: "",
      content: "",
    };
    const miniatureFile = editorRef.current?.image ?? null;
    const { title, content } = editorData;

    if (!title) {
      if (allowEmpty) return true;
      setPageError("Add a title before saving the draft.");
      return false;
    }
    if (!content) {
      if (allowEmpty) return true;
      setPageError("Write some content before saving the draft.");
      return false;
    }

    setLoading(true);
    try {
      const response = draftId
        ? await apiClient.articles.update(draftId, title, content, miniatureFile)
        : await apiClient.articles.create(title, content, miniatureFile);
      if (response.success === false) {
        setError(response.error);
        setErrorStatus(response.status || null);
        return false;
      }
      clearCachedData();
      return true;
    } catch {
      setError("Unable to connect to the server.");
      return false;
    } finally {
      setLoading(false);
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

  async function handleSubmit(
  event: FormEvent<HTMLFormElement>
) {
  event.preventDefault();

  setError("");

  const editorData = editorRef.current?.getData() ?? {
    title: "",
    content: "",
  };

  const miniatureFile = editorRef.current?.image ?? null;
  const { title, content } = editorData;

  if (!title) {
    setPageError("Add a title before continuing.");
    return;
  }
  if (!content) {
    setPageError("Write some content before continuing.");
    return;
  }
  setLoading(true);

  try {
    
    const createResponse = draftId
      ? await apiClient.articles.update(draftId, title, content, miniatureFile)
      : await apiClient.articles.create(title, content, miniatureFile);
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
    const redirectTo =
      searchParams.get("redirect") || "/";
    router.push(redirectTo);
    router.refresh();

  } catch {
    setError("Unable to connect to the server.");
  } finally {
    setLoading(false);
  }
}
  if (error) {
    return <ErrorPage statusCode={errorStatus ?? 500} message={error} />;
  }
  return (
    <PageShell
      offset="none"
      containerClassName="max-w-xl pt-40"
      header={
        <AppHeader
          left={
            <div className="flex gap-2">
              <NavLink href="/" onClick={handleHomeClick}>
                Home
              </NavLink>
              <NavLink href="/drafts">Drafts</NavLink>
            </div>
          }
          right={<LogoutButton beforeLogout={() => persistDraft(true)} />}
        />
      }
    >
      <div className="flex flex-col items-center text-center">
        <h1 className="text-5xl font-bold">Publish</h1>
        <p className="mt-2 text-xl">your academic work</p>
      </div>

      <hr className="mt-16 border-t" />

      <form onSubmit={handleSubmit} className="mt-8">
        <TextEditor
          ref={editorRef}
          initialData={savedData}
          onChange={cacheData}
          onImageUpload={async (file) => {
            const response = await apiClient.uploads.image(file);

            return response.success ? response.data.url : null;
          }}
        />

        {pageError ? <p className="mt-4 form-error">{pageError}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="btn-action-full mt-12 py-3 font-bold"
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
        <button
          type="button"
          onClick={saveDraft}
          disabled={loading}
          className="btn-action-full mt-4 py-3 font-bold"
        >
          Save as draft
        </button>
      </form>
    </PageShell>
  );
}