"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/apiClient";
import { useChat } from "@/components/chat/ChatProvider";
import ConversationList from "@/components/chat/ConversationList";
import MessageList from "@/components/chat/MessageList";
import MessageInput from "@/components/chat/MessageInput";
import OnlineDot from "@/components/chat/OnlineDot";
import type { User } from "@/lib/types";

//full-screen chat, all the state (contacts, messages, socket) comes from ChatProvider
export default function ChatPage() {
  const [me, setMe] = useState<User | null>(null);
  const [notLoggedIn, setNotLoggedIn] = useState(false);
  const { onlineUserIds, contacts, activeContact, messages, error, openChatWith, sendMessage } = useChat();

  //on load: who's logged in (to show their name)
  useEffect(() => {
    apiClient.auth.me().then((response) => {
      if (response.success) setMe(response.data);
      else setNotLoggedIn(true);
    });
  }, []);

  if (notLoggedIn) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p>Vous devez être connecté pour utiliser la messagerie.</p>
        <Link href="/authentication/login?redirect=/chat" className="border px-4 py-2 hover:underline">
          Connexion
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex h-screen w-full max-w-4xl flex-col px-4 py-8">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Échanger</h1>
        <div className="flex items-center gap-4">
          {me && (
            <p className="text-sm text-gray-600">
              Connecté en tant que <span className="font-bold">{me.name}</span>
            </p>
          )}
          <Link href="/" className="hover:underline">
            Accueil
          </Link>
        </div>
      </header>

      <div className="mt-6 flex min-h-0 flex-1 border">
        {/* user list */}
        <aside className="w-56 shrink-0 overflow-y-auto border-r">
          <ConversationList users={contacts} selectedUserId={activeContact?.id ?? null} onSelect={openChatWith} />
        </aside>

        {/* conversation */}
        <section className="flex min-w-0 flex-1 flex-col">
          {!activeContact ? (
            <p className="m-auto text-sm text-gray-600">Sélectionnez un utilisateur pour commencer à échanger.</p>
          ) : (
            <>
              <h2 className="flex items-center gap-2 border-b px-4 py-3 font-bold">
                <OnlineDot online={onlineUserIds.has(activeContact.id)} />
                <Link href={`/users/${activeContact.id}`} className="hover:underline">
                  {activeContact.name}
                </Link>
                <span className="text-xs font-normal text-gray-600">
                  {onlineUserIds.has(activeContact.id) ? "en ligne" : "hors ligne"}
                </span>
              </h2>

              <MessageList messages={messages} myId={me?.id ?? null} otherUserName={activeContact.name} />

              {error && <p className="px-4 text-sm font-bold text-foreground">{error}</p>}

              <MessageInput placeholder={`Message à ${activeContact.name}`} onSend={sendMessage} />
            </>
          )}
        </section>
      </div>
    </main>
  );
}
