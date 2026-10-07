"use client";

import { Suspense, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import PageShell from "@/components/PageShell";
import GithubLoginButton from "@/components/GithubLoginButton";

function LoginForm() {
  const searchParams = useSearchParams();
  const pendingFromGithub = searchParams.get("pending2fa") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsCode, setNeedsCode] = useState(pendingFromGithub);

  function redirectAfterLogin() {
    const redirectTo = searchParams.get("redirect") || "/";
    //full reload so the layout re-reads the session and the chat picks up the right user
    window.location.assign(redirectTo);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await apiClient.auth.login(email, password);

      if ("requires2fa" in response) {
        setNeedsCode(true);
        return;
      }
      if (!response.success) {
        setError(response.error ?? "Impossible de se connecter.");
        return;
      }
      redirectAfterLogin();
    } catch {
      setError("Impossible de se connecter au serveur.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await apiClient.twoFactor.verifyLogin(code);
      if (!response.success) {
        //"No pending login" = the 5 min window ran out:
        //back to email/password, no point retyping a dead code
        if (response.error === "No pending login") {
          setNeedsCode(false);
          setCode("");
          setError("Votre session a expiré. Veuillez vous reconnecter.");
          return;
        }
        setError(response.error ?? "Code invalide.");
        return;
      }
      redirectAfterLogin();
    } catch {
      setError("Impossible de se connecter au serveur.");
    } finally {
      setLoading(false);
    }
  }

  if (needsCode) {
    return (
      <PageShell variant="auth">
        <h1 className="text-3xl font-bold">Authentification à deux facteurs</h1>
        <p className="mt-2 text-muted-foreground">
          Enter the 6-digit code from your authenticator app.
        </p>

        <form onSubmit={handleVerifyCode} className="mt-8 flex flex-col gap-4">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            required
            className="field-input"
            autoFocus
          />
          {error ? <p className="form-error">{error}</p> : null}
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="btn-nav w-full justify-center disabled:opacity-50"
          >
            {loading ? "Vérification…" : "Vérifier"}
          </button>
        </form>
      </PageShell>
    );
  }

  return (
    <PageShell variant="auth">
      <h1 className="text-3xl font-bold">Bienvenue</h1>
      <p className="mt-2 text-muted-foreground">Connectez-vous à OpenScholar.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field-input"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password">Mot de passe</label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field-input"
          />
        </div>

        {error ? <p className="form-error">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="btn-nav w-full justify-center disabled:opacity-50"
        >
          {loading ? "Connexion…" : "Connexion"}
        </button>
      </form>

      <div className="mt-6">
        <GithubLoginButton redirectTo={searchParams.get("redirect") || undefined} />
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link href="/authentication/register" className="font-medium text-foreground hover:underline">
          S&apos;inscrire
        </Link>
      </p>
    </PageShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="p-8">Chargement…</p>}>
      <LoginForm />
    </Suspense>
  );
}