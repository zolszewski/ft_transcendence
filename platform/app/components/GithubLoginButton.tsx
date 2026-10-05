"use client";

export default function GithubLoginButton({ redirectTo }: { redirectTo?: string }) {
  function handleClick() {
    const target = redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : "";
    window.location.href = `/api/auth/oauth/github${target}`;
  }

  return (
    <button type="button" onClick={handleClick} className="btn-nav w-full justify-center">
      Continue with GitHub
    </button>
  );
}