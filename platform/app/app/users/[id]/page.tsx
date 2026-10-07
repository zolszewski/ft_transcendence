"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import type { User } from "@/lib/types";
import { useChat } from "@/components/chat/ChatProvider";
import OnlineDot from "@/components/chat/OnlineDot";
import AppHeader from "@/components/AppHeader";
import ErrorPage from "@/components/ErrorPage";
import LogoutButton from "@/components/LogoutButton";
import NavLink from "@/components/NavLink";
import PageShell from "@/components/PageShell";
import UserProfileSection from "@/components/UserProfileSection";
import FriendActions from "@/components/FriendActions";

//someone else's public profile: read-only info, online status,
//and a button to message them (opens the chat window at the bottom)
export default function UserProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { myId, onlineUserIds, openChatWith } = useChat();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  //your own profile is edited from the dashboard
  const isMe = myId !== null && myId === params.id;
  useEffect(() => {
    if (isMe) router.replace("/dashboard");
  }, [isMe, router]);

  useEffect(() => {
    if (isMe) return;
    //drop the response if we switched profiles meanwhile
    let cancelled = false;
    apiClient.profile.get(params.id).then((response) => {
      if (cancelled) return;
      if (response.success) {
        setUser(response.data);
        setError("");
      } else {
        setError(response.error);
        setErrorStatus(response.status);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [params.id, isMe]);

  if (error) return <ErrorPage statusCode={errorStatus ?? 500} message={error} />;

  const online = onlineUserIds.has(params.id);

  return (
    <PageShell
      variant="dashboard"
      header={
        <AppHeader
          variant="bordered"
          left={<NavLink href="/">Accueil</NavLink>}
          center={<h1 className="text-xl font-bold">Profil</h1>}
          right={
            myId ? (
              <div className="flex items-center gap-2">
                <NavLink href="/friends">Amis</NavLink>
                <LogoutButton />
              </div>
            ) : null
          }
        />
      }
    >
      {!user || isMe ? (
        <p className="p-4 text-sm text-gray-600">Chargement…</p>
      ) : (
        <>
          {/* key: resets the inner form when switching profiles */}
          <UserProfileSection key={user.id} user={user} isOwner={false} />

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <p className="flex items-center gap-2 text-sm">
              <OnlineDot online={online} />
              <span aria-hidden="true">{online ? "Online" : "Offline"}</span>
            </p>
            {/* chat's only for logged-in users */}
            {myId ? (
              <>
                <button type="button" className="btn-nav" onClick={() => openChatWith(user)}>
                  Message
                </button>
                <FriendActions targetUserId={user.id} currentUserId={myId} />
              </>
            ) : null}
          </div>
        </>
      )}
    </PageShell>
  );
}
