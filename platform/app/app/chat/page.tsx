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

// version plein écran du chat : tout l'état (contacts, messages, socket) vient du ChatProvider (layout)
export default function ChatPage() {
  const [me, setMe] = useState<User | null>(null);
  const [notLoggedIn, setNotLoggedIn] = useState(false);
  const { onlineUserIds, contacts, activeContact, messages, error, openChatWith, sendMessage } = useChat();

  // au chargement : qui est connecté (pour afficher son nom)
  useEffect(() => {
    apiClient.auth.me().then((response) => {
      if (response.success) setMe(response.data);
      else setNotLoggedIn(true);
    });
  }, []);

  if (notLoggedIn) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p>You must be logged in to use the chat.</p>
        <Link href="/authentication/login?redirect=/chat" className="border px-4 py-2 hover:underline">
          Login
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex h-screen w-full max-w-4xl flex-col px-4 py-8">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Chat</h1>
        <div className="flex items-center gap-4">
          {me && (
            <p className="text-sm text-gray-600">
              Connected as <span className="font-bold">{me.name}</span>
            </p>
          )}
          <Link href="/" className="hover:underline">
            Home
          </Link>
        </div>
      </header>

      <div className="mt-6 flex min-h-0 flex-1 border">
        {/* liste des utilisateurs */}
        <aside className="w-56 shrink-0 overflow-y-auto border-r">
          <ConversationList users={contacts} selectedUserId={activeContact?.id ?? null} onSelect={openChatWith} />
        </aside>

        {/* conversation */}
        <section className="flex min-w-0 flex-1 flex-col">
          {!activeContact ? (
            <p className="m-auto text-sm text-gray-600">Select a user to start chatting.</p>
          ) : (
            <>
              <h2 className="flex items-center gap-2 border-b px-4 py-3 font-bold">
                <OnlineDot online={onlineUserIds.has(activeContact.id)} />
                <Link href={`/users/${activeContact.id}`} className="hover:underline">
                  {activeContact.name}
                </Link>
                <span className="text-xs font-normal text-gray-600">
                  {onlineUserIds.has(activeContact.id) ? "online" : "offline"}
                </span>
              </h2>

              <MessageList messages={messages} myId={me?.id ?? null} otherUserName={activeContact.name} />

              {error && <p className="px-4 text-sm text-red-600">{error}</p>}

              <MessageInput placeholder={`Message ${activeContact.name}`} onSend={sendMessage} />
            </>
          )}
        </section>
      </div>
    </main>
  );
}
