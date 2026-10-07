"use client";

import { useCallback, useEffect, useState } from "react";
import type { FriendRelationStatus } from "@/lib/types";
import {
  acceptFriendRequest,
  fetchRelationStatus,
  removeFriendship,
  sendFriendRequest,
  subscribeFriendsChange,
} from "@/lib/front/friends";

type FriendActionsProps = {
  targetUserId: string;
  currentUserId?: string;
};

export default function FriendActions({
  targetUserId,
  currentUserId,
}: FriendActionsProps) {
  const [status, setStatus] = useState<FriendRelationStatus>("none");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!currentUserId || targetUserId === currentUserId) return;
    setStatus(await fetchRelationStatus(targetUserId));
  }, [currentUserId, targetUserId]);

  useEffect(() => {
    void reload();
    return subscribeFriendsChange(() => {
      void reload();
    });
  }, [reload]);

  if (!currentUserId || targetUserId === currentUserId) {
    return null;
  }

  async function run(action: () => Promise<{ success: boolean; error?: string }>) {
    setBusy(true);
    setError("");
    const result = await action();
    if (!result.success) setError(result.error || "Une erreur s'est produite");
    else await reload();
    setBusy(false);
  }

  if (status === "friends") {
    return (
      <div className="flex flex-col items-end gap-1">
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        <button
          type="button"
          className="btn-nav-sm"
          disabled={busy}
          onClick={() => run(() => removeFriendship(targetUserId))}
        >
          Remove friend
        </button>
      </div>
    );
  }

  if (status === "pending_incoming") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {error ? <p className="w-full text-xs text-destructive">{error}</p> : null}
        <button
          type="button"
          className="btn-nav"
          disabled={busy}
          onClick={() => run(() => acceptFriendRequest(targetUserId))}
        >
          Accept
        </button>
        <button
          type="button"
          className="btn-nav-sm"
          disabled={busy}
          onClick={() => run(() => removeFriendship(targetUserId))}
        >
          Reject
        </button>
      </div>
    );
  }

  if (status === "pending_outgoing") {
    return (
      <div className="flex flex-col items-end gap-1">
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        <button
          type="button"
          className="btn-nav-sm"
          disabled={busy}
          onClick={() => run(() => removeFriendship(targetUserId))}
        >
          Cancel request
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <button
        type="button"
        className="btn-nav"
        disabled={busy}
        onClick={() => run(() => sendFriendRequest(targetUserId))}
      >
        Ajouter en ami
      </button>
    </div>
  );
}
