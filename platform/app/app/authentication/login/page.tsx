"use client";

import { Suspense, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import PageShell from "@/components/PageShell";

function LoginForm() {
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
    <PageShell variant="auth">
        <h1 className="text-3xl font-bold">
          Login
        </h1>

        <form
          onSubmit={handleSubmit}
          className="mt-8 flex flex-col gap-4"
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
              className="field-input"
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
              className="field-input"
            />
          </div>

          {error ? (
            <p className="form-error">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="btn-nav w-full justify-center disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

        <p className="mt-6 text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            href="/authentication/register"
            className="font-medium text-foreground hover:underline"
          >
            Register
          </Link>
        </p>

        <p className="mt-3 text-sm">
          <Link
            href="/"
            className="text-muted-foreground hover:underline"
          >
            Back to OpenScholar
          </Link>
        </p>
    </PageShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="p-8">Loading...</p>}>
      <LoginForm />
    </Suspense>
  );
}
