"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { apiClient } from "@/lib/apiClient";

type LikeSectionProps = {
  articleId: string;
  authorId: string;
  likeCount: number;
  likedByMe: boolean;
  isLoggedIn: boolean | null;
  currentUserId: string | null;
  loginHref: string;
};

export default function LikeSection({
  articleId,
  authorId,
  likeCount: initialLikeCount,
  likedByMe: initialLikedByMe,
  isLoggedIn,
  currentUserId,
  loginHref,
}: LikeSectionProps) {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [likedByMe, setLikedByMe] = useState(initialLikedByMe);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLikeCount(initialLikeCount);
    setLikedByMe(initialLikedByMe);
  }, [articleId, initialLikeCount, initialLikedByMe]);

  const isOwnArticle = currentUserId !== null && currentUserId === authorId;
  const canToggle = isLoggedIn === true && !isOwnArticle;

  async function handleToggle() {
    if (!canToggle || busy) return;
    setBusy(true);
    setError("");
    const response = likedByMe
      ? await apiClient.articles.unlike(articleId)
      : await apiClient.articles.like(articleId);
    if (response.success) {
      setLikedByMe((previous) => !previous);
      setLikeCount((previous) => (likedByMe ? Math.max(0, previous - 1) : previous + 1));
    } else {
      setError(response.error);
    }
    setBusy(false);
  }

  return (
    <section className="section-divider-spaced">
      <h2 className="text-xl font-bold">Likes</h2>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {canToggle ? (
          <button
            type="button"
            onClick={handleToggle}
            disabled={busy}
            className={`btn-nav inline-flex items-center gap-2 ${likedByMe ? "border-primary text-primary" : ""}`}
            aria-pressed={likedByMe}
          >
            <Heart size={18} className={likedByMe ? "fill-current" : undefined} aria-hidden="true" />
            {likedByMe ? "Liked" : "Like"}
          </button>
        ) : isLoggedIn === false ? (
          <Link href={loginHref} className="btn-nav inline-flex items-center gap-2">
            <Heart size={18} aria-hidden="true" />
            Log in to like
          </Link>
        ) : isOwnArticle ? (
          <span className="text-sm text-muted-foreground">You cannot like your own article.</span>
        ) : null}
        <span className="text-sm text-muted-foreground">
          {likeCount} {likeCount === 1 ? "like" : "likes"}
        </span>
      </div>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </section>
  );
}
