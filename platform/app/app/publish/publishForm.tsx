"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import TextEditor from "@/components/text editor";

export default function PublishForm() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // handle submission
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden">
      <header className="absolute left-0 right-0 top-0 flex items-center justify-between p-4">
        <Link href="/" className="border px-4 py-2 hover:underline">
          Home
        </Link>
        <LogoutButton />
      </header>
      <div className="flex flex-col items-center justify-center pt-40 text-center">
        <h1 className="text-5xl font-bold">Publish</h1>
        <p className="mt-2 text-xl">your academic work</p>
      </div>

      <hr className="mt-16 w-full max-w-xl border-t" />

      <form onSubmit={handleSubmit} className="mt-16 w-full max-w-xl px-4">
        <TextEditor />

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