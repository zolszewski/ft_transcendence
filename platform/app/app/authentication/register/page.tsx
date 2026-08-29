"use client";


import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
      
        setError(
          data?.error ?? "Unable 4444 to create your account."
        );

        return;
      }

      router.push("/authentication/login");
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm px-6">

        <h1 className="text-3xl font-bold">
          Create your account
        </h1>

        <p className="mt-2 text-gray-600">
          Join OpenScholar.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 flex flex-col gap-4"
        >

          <div className="flex flex-col gap-2">
            <label htmlFor="name">
              Name
            </label>

            <input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="border p-2"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="border p-2"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="border p-2"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="border p-2 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Register"}
          </button>

        </form>

        <p className="mt-6 text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            href="/authentication/login"
            className="font-medium text-black hover:underline"
          >
            Login
          </Link>
        </p>

        <p className="mt-3 text-sm">
          <Link
            href="/"
            className="text-gray-600 hover:underline"
          >
            Back to OpenScholar
          </Link>
        </p>

      </div>
    </main>
  );
}