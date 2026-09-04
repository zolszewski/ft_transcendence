"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/apiClient";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    
    setError("");
    setLoading(true);

    try {
      const authResponse = await apiClient.auth.login(email, password);
      if (!authResponse.success) {
        setError(
          authResponse.error ?? "Invalid email or password."
        );
        return;
      }
      const redirectTo = searchParams.get("redirect") || "/";
      router.push(redirectTo);
      router.refresh();

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
          Login
        </h1>

        <form
          onSubmit={handleSubmit}
        >

          <div className="flex flex-col gap-2">
            <label htmlFor="email">
              Email
            </label>

            <input
              type="email"
              id="email"
              name="email"
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
              type="password"
              id="password"
              name="password"
              required
              autoComplete="current-password"
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
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

        <p className="mt-6 text-sm text-gray-600">
          Don't have an account?{" "}
          <Link
            href="/authentication/register"
            className="font-medium text-black hover:underline"
          >
            Register
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