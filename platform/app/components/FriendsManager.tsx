"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { FriendRequestItem, FriendSummary, User } from "@/lib/types";
import FriendActions from "@/components/FriendActions";
import OnlineDot from "@/components/chat/OnlineDot";
import { useChat } from "@/components/chat/ChatProvider";
import { apiClient } from "@/lib/apiClient";
import { getSocket } from "@/lib/socket";
import { notifyFriendsChange, subscribeFriendsChange } from "@/lib/front/friends";

type FriendsManagerProps = {
  currentUser: User;
};

export default function FriendsManager({ currentUser }: FriendsManagerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { onlineUserIds } = useChat();

  const queryFromUrl = searchParams.get("q") ?? "";
  const [inputValue, setInputValue] = useState(queryFromUrl);
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [requests, setRequests] = useState<FriendRequestItem[]>([]);
  const [results, setResults] = useState<{ id: string; name: string; avatarUrl: string | null }[]>(
    [],
  );
  const [searching, setSearching] = useState(false);
  const [loadError, setLoadError] = useState("");

  const reloadLists = useCallback(async () => {
    const [friendsRes, requestsRes] = await Promise.all([
      apiClient.friends.list(),
      apiClient.friends.listRequests(),
    ]);
    if (friendsRes.success) setFriends(friendsRes.data);
    else setLoadError(friendsRes.error);
    if (requestsRes.success) setRequests(requestsRes.data);
  }, []);

  useEffect(() => {
    void reloadLists();
    return subscribeFriendsChange(() => {
      void reloadLists();
    });
  }, [reloadLists]);

  useEffect(() => {
    const socket = getSocket();
    function handleFriendEvent() {
      notifyFriendsChange();
    }
    socket.on("friend:request", handleFriendEvent);
    socket.on("friend:accepted", handleFriendEvent);
    return () => {
      socket.off("friend:request", handleFriendEvent);
      socket.off("friend:accepted", handleFriendEvent);
    };
  }, []);

  useEffect(() => {
    setInputValue(queryFromUrl);
  }, [queryFromUrl]);

  useEffect(() => {
    let cancelled = false;

    async function runSearch() {
      if (!queryFromUrl.trim()) {
        setResults([]);
        setSearching(false);
        return;
      }
      setSearching(true);
      const response = await apiClient.friends.search(queryFromUrl.trim());
      if (cancelled) return;
      if (response.success) {
        setResults(response.data.filter((user) => user.id !== currentUser.id));
      } else {
        setResults([]);
      }
      setSearching(false);
    }

    void runSearch();
    return () => {
      cancelled = true;
    };
  }, [queryFromUrl, currentUser.id]);

  function pushQuery(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = value.trim();
    if (trimmed) params.set("q", trimmed);
    else params.delete("q");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    pushQuery(inputValue);
  }

  return (
    <div className="space-y-8">
      {loadError ? <p className="alert-banner-error">{loadError}</p> : null}

      <p className="text-lg">
        <span className="font-bold">{friends.length}</span>{" "}
        <span className="text-muted-foreground">
          {friends.length === 1 ? "friend" : "friends"}
        </span>
      </p>

      <nav className="border-b pb-4">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
          <label htmlFor="friend-search" className="sr-only">
            Search for a friend
          </label>
          <input
            id="friend-search"
            type="search"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="Search for a friend"
            className="field-input min-w-[min(100%,16rem)] flex-1"
            autoComplete="off"
          />
          <button type="submit" className="btn-nav">
            Search
          </button>
        </form>
      </nav>

      {requests.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Friend requests</h2>
          <ul className="space-y-3">
            {requests.map((request) => (
              <li
                key={request.id}
                className="flex flex-wrap items-center justify-between gap-3 border p-4"
              >
                <Link href={`/users/${request.from.id}`} className="font-semibold hover:underline">
                  {request.from.name}
                </Link>
                <FriendActions targetUserId={request.from.id} currentUserId={currentUser.id} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Your friends</h2>
        {friends.length === 0 ? (
          <p className="text-sm text-muted-foreground">No friends yet. Search above to add someone.</p>
        ) : (
          <ul className="space-y-3">
            {friends.map((friend) => (
              <li
                key={friend.id}
                className="flex flex-wrap items-center justify-between gap-3 border p-4"
              >
                <div className="flex items-center gap-3">
                  <OnlineDot online={onlineUserIds.has(friend.id)} />
                  <Link href={`/users/${friend.id}`} className="font-semibold hover:underline">
                    {friend.name}
                  </Link>
                  {friend.faculty ? (
                    <span className="text-sm text-muted-foreground">{friend.faculty}</span>
                  ) : null}
                </div>
                <FriendActions targetUserId={friend.id} currentUserId={currentUser.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {queryFromUrl.trim() ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Search results</h2>
          {searching ? (
            <p className="text-sm text-muted-foreground">Searching...</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users found.</p>
          ) : (
            <ul className="space-y-3">
              {results.map((user) => (
                <li
                  key={user.id}
                  className="flex flex-wrap items-center justify-between gap-3 border p-4"
                >
                  <Link href={`/users/${user.id}`} className="font-semibold hover:underline">
                    {user.name}
                  </Link>
                  <FriendActions targetUserId={user.id} currentUserId={currentUser.id} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
