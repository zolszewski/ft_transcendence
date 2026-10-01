"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { User } from "@/lib/types";
import FriendActions from "@/components/FriendActions";
import {
  getFriendCount,
  subscribeFriendsChange,
} from "@/lib/front/friends";

type FriendsManagerProps = {
  currentUser: User;
};

export default function FriendsManager({ currentUser }: FriendsManagerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const queryFromUrl = searchParams.get("q") ?? "";
  const [inputValue, setInputValue] = useState(queryFromUrl);
  const [friendCount, setFriendCount] = useState(0);
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);

  const refreshCount = useCallback(() => {
    setFriendCount(getFriendCount());
  }, []);

  useEffect(() => {
    refreshCount();
    return subscribeFriendsChange(refreshCount);
  }, [refreshCount]);

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
      if (!cancelled) {
        setResults([]);
        setSearching(false);
      }
    }

    runSearch();
    return () => {
      cancelled = true;
    };
  }, [queryFromUrl, currentUser.id]);

  function pushQuery(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = value.trim();
    if (trimmed) {
      params.set("q", trimmed);
    } else {
      params.delete("q");
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    pushQuery(inputValue);
  }

  return (
    <div className="space-y-8">
      <p className="text-lg">
        <span className="font-bold">{friendCount}</span>{" "}
        <span className="text-muted-foreground">
          {friendCount === 1 ? "friend" : "friends"}
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

      {queryFromUrl.trim() ? (
        <section>
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
                  <div>
                    <p className="font-semibold">{user.name}</p>
                    {user.email ? (
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    ) : null}
                  </div>
                  <FriendActions
                    targetUserId={user.id}
                    currentUserId={currentUser.id}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
