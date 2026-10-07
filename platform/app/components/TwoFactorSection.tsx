"use client";

import { useState } from "react";
import { apiClient } from "@/lib/apiClient";

interface TwoFactorSectionProps {
  enabled: boolean;
  onChanged?: (enabled: boolean) => void;
}

export default function TwoFactorSection({
  enabled,
  onChanged,
}: TwoFactorSectionProps) {
  const [setup, setSetup] = useState<{
    otpauthUrl: string;
    qrCode: string;
  } | null>(null);

  const [showDisable, setShowDisable] = useState(false);

  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleStartSetup() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await apiClient.twoFactor.setup();

      if (!response.success) {
        setError(response.error ?? "Impossible de démarrer la configuration 2FA.");
        return;
      }

      setSetup(response.data);
      setCode("");
    } catch {
      setError("Impossible de se connecter au serveur.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEnable() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await apiClient.twoFactor.enable(code);

      if (!response.success) {
        setError(response.error ?? "Code d'authentification invalide.");
        return;
      }

      setSetup(null);
      setCode("");
      setMessage("L'authentification à deux facteurs a été activée.");
      onChanged?.(true);
    } catch {
      setError("Impossible de se connecter au serveur.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await apiClient.twoFactor.disable(password, code);

      if (!response.success) {
        setError(response.error ?? "Impossible de désactiver la 2FA.");
        return;
      }

      setPassword("");
      setCode("");
      setShowDisable(false);
      setMessage("L'authentification à deux facteurs a été désactivée.");
      onChanged?.(false);
    } catch {
      setError("Impossible de se connecter au serveur.");
    } finally {
      setLoading(false);
    }
  }

  function cancelSetup() {
    setSetup(null);
    setCode("");
    setError("");
    setMessage("");
  }

  function cancelDisable() {
    setShowDisable(false);
    setPassword("");
    setCode("");
    setError("");
    setMessage("");
  }

  function openDisable() {
    setShowDisable(true);
    setPassword("");
    setCode("");
    setError("");
    setMessage("");
  }

  return (
    <section className="section-divider mt-6 border-t pt-4">
      {setup ? (
        /* -------------------- SETUP 2FA -------------------- */
        <div>
          <p className="text-sm font-medium">
            Configurer votre application d&apos;authentification
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Scannez ce code QR avec Google Authenticator, Microsoft Authenticator, Authy ou une autre application compatible TOTP.
          </p>

          <div className="mt-4 flex justify-center">
            <img
              src={setup.qrCode}
              alt="Code QR d'authentification à deux facteurs"
              className="h-48 w-48 border border-border p-2"
            />
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Après avoir scanné le code QR, saisissez le code à 6 chiffres généré par votre application d&apos;authentification.
          </p>

          <div className="mx-auto mt-4 flex max-w-sm flex-col gap-3">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="123456"
              className="field-input text-center tracking-widest"
              autoFocus
            />

            <button
              type="button"
              onClick={handleEnable}
              disabled={loading || code.length !== 6}
              className="btn-nav justify-center disabled:opacity-50"
            >
              {loading ? "Vérification…" : "Activer la 2FA"}
            </button>

            <button
              type="button"
              onClick={cancelSetup}
              disabled={loading}
              className="btn-nav justify-center"
            >
              Annuler
            </button>
          </div>

          <details className="mt-4">
            <summary className="cursor-pointer text-xs text-muted-foreground">
              Impossible de scanner le code QR ?
            </summary>

            <p className="mt-2 break-all text-xs text-muted-foreground">
              {setup.otpauthUrl}
            </p>
          </details>
        </div>
      ) : showDisable ? (
        /* -------------------- DISABLE 2FA -------------------- */
        <div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">
                Désactiver l&apos;authentification à deux facteurs
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Saisissez votre mot de passe et le code actuel de l&apos;application d&apos;authentification.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe actuel"
              autoComplete="current-password"
              className="field-input"
              autoFocus
            />

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="Code d'authentification à 6 chiffres"
              className="field-input"
            />
          </div>

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={cancelDisable}
              disabled={loading}
              className="btn-nav"
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={handleDisable}
              disabled={
                loading ||
                code.length !== 6 ||
                password.length === 0
              }
              className="btn-nav disabled:opacity-50"
            >
              {loading ? "Désactivation…" : "Confirmer"}
            </button>
          </div>
        </div>
      ) : (
        /* -------------------- NORMAL STATE -------------------- */
        <div className="flex items-center justify-between gap-4">
          <div>
            {enabled ? (
              <>
                <p className="text-sm font-medium">
                  L&apos;authentification à deux facteurs est activée.
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Vous aurez besoin de votre code d&apos;authentification lors de la connexion.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium">
                  L&apos;authentification à deux facteurs n&apos;est pas activée.
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Protégez votre compte avec un code d&apos;authentification temporel.
                </p>
              </>
            )}
          </div>

          {enabled ? (
            <button
              type="button"
              onClick={openDisable}
              disabled={loading}
              className="btn-nav shrink-0"
            >
              Désactiver la 2FA
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartSetup}
              disabled={loading}
              className="btn-nav shrink-0 disabled:opacity-50"
            >
              {loading ? "Démarrage de la configuration…" : "Activer la 2FA"}
            </button>
          )}
        </div>
      )}

      {error ? (
        <p className="mt-4 form-error">
          {error}
        </p>
      ) : null}

      {message ? (
        <p className="mt-4 text-sm font-bold text-foreground">
          {message}
        </p>
      ) : null}
    </section>
  );
}