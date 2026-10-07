"use client";


import { Suspense, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import PageShell from "@/components/PageShell";
import GithubLoginButton from "@/components/GithubLoginButton";

function RegisterForm() {
  const searchParams = useSearchParams();

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
      const registerResponse = await apiClient.auth.register(name, email, password);
      if (!registerResponse.success) {
        setError(registerResponse.error ?? "Impossible de créer votre compte.");
        return;
      }
      const redirectTo = searchParams.get("redirect") || "/";
      //full reload so the layout re-reads the session and the chat picks up the right user
      window.location.assign(redirectTo);
    } catch {
      setError("Impossible de se connecter au serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell variant="auth">
        <h1 className="text-3xl font-bold">
          Create your account
        </h1>

        <p className="mt-2 text-muted-foreground">
          Rejoignez OpenScholar.
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
              className="field-input"
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
              className="field-input"
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
            {loading ? "Création du compte…" : "Inscription"}
          </button>

        </form>
        <GithubLoginButton redirectTo={searchParams.get("redirect") || undefined} />
        <p className="mt-6 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/authentication/login"
            className="font-medium text-foreground hover:underline"
          >
            Login
          </Link>
        </p>
        
        <p className="mt-3 text-sm">
          <Link
            href="/"
            className="text-muted-foreground hover:underline"
          >
            Retour à OpenScholar
          </Link>
        </p>
    </PageShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<p className="p-8">Chargement…</p>}>
      <RegisterForm />
    </Suspense>
  );
}
