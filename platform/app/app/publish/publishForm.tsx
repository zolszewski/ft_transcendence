"use client";

import { useState } from "react";

export default function PublishForm() {


  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  function handleFileChange(e) {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setSummary("");
    }
  }

  function handleGenerateSummary() {
    if (!file) return;
    setLoading(true);
    setTimeout(() => {
      setSummary(`Summary of ${file.name} will appear here.`);
      setLoading(false);
    }, 800);
  }

  function handleSubmit(e) {
    e.preventDefault();
    // handle submission
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden">
      <div className="flex flex-col items-center justify-center pt-40 text-center">
        <h1 className="text-5xl font-bold">Publish</h1>
        <p className="mt-2 text-xl">your academic work</p>
      </div>

      <hr className="mt-16 w-full max-w-xl border-t" />

      <form onSubmit={handleSubmit} className="mt-16 w-full max-w-xl px-4">
        <section>
          <h2 className="text-xl font-bold">Upload</h2>
          <p className="mt-1 text-sm">Select the PDF of your manuscript.</p>
          <label className="mt-4 flex cursor-pointer flex-col items-center justify-center border p-8 text-center">
            <span>
              {file ? file.name : "Drop a PDF here, or click to browse"}
            </span>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-bold">Summary</h2>
          <p className="mt-1 text-sm">Generate a summary of your article.</p>
          <button
            type="button"
            onClick={handleGenerateSummary}
            disabled={!file || loading}
            className="mt-4 border px-4 py-2 disabled:opacity-40"
          >
            {loading ? "Generating..." : "Generate summary"}
          </button>
          {summary && <p className="mt-4 text-sm">{summary}</p>}
        </section>

        <button
          type="submit"
          className="mt-12 w-full border py-3 font-bold hover:underline"
        >
          Submit
        </button>
      </form>
    </main>
  );
}