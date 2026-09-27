"use client";

import { useEffect, useState } from "react";
import {
  addFriend,
  getRelationStatus,
  removeFriend,
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
  const [status, setStatus] = useState(() =>
    getRelationStatus(targetUserId, currentUserId),
  );

  useEffect(() => {
    setStatus(getRelationStatus(targetUserId, currentUserId));
    return subscribeFriendsChange(() => {
      setStatus(getRelationStatus(targetUserId, currentUserId));
    });
  }, [targetUserId, currentUserId]);

  if (!currentUserId || targetUserId === currentUserId) {
    return null;
  }

  if (status === "friends") {
    return (
      <button
        type="button"
        className="btn-nav-sm"
        onClick={() => {
          removeFriend(targetUserId);
          setStatus("none");
        }}
      >
        Remove friend
      </button>
    );
  }

  return (
    <button
      type="button"
      className="btn-nav"
      onClick={() => {
        addFriend(targetUserId);
        setStatus("friends");
      }}
    >
      Add friend
    </button>
  );
}
