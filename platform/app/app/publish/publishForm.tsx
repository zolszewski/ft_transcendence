"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import TextEditor from "@/components/text-editor";
import type { TextEditorHandle } from "@/components/text-editor";
import { apiClient } from "@/lib/apiClient";


export default function PublishForm() {
  const draftStorageKey = "publish-form-draft";
  const router = useRouter();
  const searchParams = useSearchParams();
  const editorRef = useRef<TextEditorHandle>(null);
  const [cachedFileHandle, setCachedFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [savedData, setSavedData] = useState({ title: "", content: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const storedData = localStorage.getItem(draftStorageKey);
      if (storedData) setSavedData(JSON.parse(storedData));
    } catch {
      localStorage.removeItem(draftStorageKey);
    }
  }, []);

  function cacheData(data: { title: string; content: string }) {
    setSavedData(data);
    localStorage.setItem(draftStorageKey, JSON.stringify(data));
  }

  function clearCachedData() {
    localStorage.removeItem(draftStorageKey);
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
      setError("Add a title before saving the draft.");
      return false;
    }
    if (!content) {
      if (allowEmpty) return true;
      setError("Write some content before saving the draft.");
      return false;
    }

    setLoading(true);
    try {
      const response = await apiClient.articles.createDraft(title, content, miniatureFile);
      if (response.success === false) {
        setError(response.error);
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
    setError("Add a title before continuing.");
    return;
  }
  if (!content) {
    setError("Write some content before continuing.");
    return;
  }
  setLoading(true);

  try {
    
    const createResponse = await apiClient.articles.create(title, content, miniatureFile);
    if (createResponse.success === false) {
      setError(createResponse.error);
      return;
    }
    const article = createResponse.data;
    
    const submitResponse = await apiClient.articles.submit(article.id);
    if (submitResponse.success === false) {
      setError("Article was saved, but submitting for review failed: " + submitResponse.error);
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
  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden">
      <header className="absolute left-0 right-0 top-0 flex items-center justify-between p-4">
        <Link
          href="/"
          onClick={handleHomeClick}
          className="border px-4 py-2 hover:underline"
        >
          Home
        </Link>

        <LogoutButton beforeLogout={() => persistDraft(true)} />
      </header>

      <div className="flex flex-col items-center justify-center pt-40 text-center">
        <h1 className="text-5xl font-bold">Publish</h1>

        <p className="mt-2 text-xl">
          your academic work
        </p>
      </div>

      <hr className="mt-16 w-full max-w-xl border-t" />

      <form
        onSubmit={handleSubmit}
        className="mt-8 w-full max-w-xl px-4"
      >
        <TextEditor
          ref={editorRef}
          initialData={savedData}
          onChange={cacheData}
        />

        {error && (
          <p className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-12 w-full border py-3 font-bold hover:underline disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
        <button
          type="button"
          onClick={saveDraft}
          disabled={loading}
          className="mt-4 w-full border py-3 font-bold hover:underline disabled:opacity-50"
        >
          Save as draft
        </button>
      </form>
    </main>
  );
}