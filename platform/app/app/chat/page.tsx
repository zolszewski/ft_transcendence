"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/apiClient";
import { getSocket } from "@/lib/socket";
import { useOnlineUsers } from "@/components/chat/ChatProvider";
import ConversationList from "@/components/chat/ConversationList";
import MessageList from "@/components/chat/MessageList";
import MessageInput from "@/components/chat/MessageInput";
import OnlineDot from "@/components/chat/OnlineDot";
import type { Message, User } from "@/lib/types";

// message reçu par la socket : le back ajoute le destinataire pour savoir de quelle conversation il s'agit
type SocketMessage = Message & { recipientId: string };

export default function ChatPage() {
  const [me, setMe] = useState<User | null>(null);
  const [notLoggedIn, setNotLoggedIn] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState("");
  // ids des utilisateurs connectés, tenus à jour par le ChatProvider (layout)
  const onlineUserIds = useOnlineUsers();
  // copie de selectedUser lisible depuis le listener socket (sinon il garderait l'ancienne valeur)
  const selectedUserRef = useRef<User | null>(null);

  // au chargement : qui est connecté + liste des autres utilisateurs
  useEffect(() => {
    apiClient.auth.me().then((response) => {
      if (!response.success) {
        setNotLoggedIn(true);
        return;
      }
      setMe(response.data);
      apiClient.chat.listUsers().then((usersResponse) => {
        if (usersResponse.success) setUsers(usersResponse.data);
        else setError(usersResponse.error);
      });
    });
  }, []);

  // à chaque changement de destinataire : charger la conversation
  useEffect(() => {
    if (!selectedUser) return;
    // ignore la réponse si on a changé de destinataire entre-temps
    let cancelled = false;
    apiClient.chat.getMessages(selectedUser.id).then((response) => {
      if (cancelled) return;
      if (response.success) setMessages(response.data);
      else setError(response.error);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedUser]);

  // temps réel : écoute des nouveaux messages sur la socket ouverte par le ChatProvider
  useEffect(() => {
    if (!me) return;
    const socket = getSocket();

    function handleNewMessage(message: SocketMessage) {
      const current = selectedUserRef.current;
      // n'affiche que les messages de la conversation ouverte
      if (!current || (message.senderId !== current.id && message.recipientId !== current.id)) return;
      addMessage(message);
    }

    // pas de connect/disconnect ici : la connexion appartient au ChatProvider
    socket.on("message:new", handleNewMessage);
    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, [me]);

  // le même message peut arriver deux fois (réponse du POST + socket) : on ne l'ajoute qu'une fois
  function addMessage(message: Message) {
    setMessages((previous) =>
      previous.some((existing) => existing.id === message.id) ? previous : [...previous, message]
    );
  }

  function selectUser(user: User) {
    selectedUserRef.current = user;
    setSelectedUser(user);
    setMessages([]);
    setError("");
  }

  async function sendMessage(content: string) {
    if (!selectedUser) return false;
    setError("");
    const response = await apiClient.chat.sendMessage(selectedUser.id, content);
    if (!response.success) {
      setError(response.error);
      return false;
    }
    addMessage(response.data);
    return true;
  }

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
          <ConversationList users={users} selectedUserId={selectedUser?.id ?? null} onSelect={selectUser} />
        </aside>

        {/* conversation */}
        <section className="flex min-w-0 flex-1 flex-col">
          {!selectedUser ? (
            <p className="m-auto text-sm text-gray-600">Select a user to start chatting.</p>
          ) : (
            <>
              <h2 className="flex items-center gap-2 border-b px-4 py-3 font-bold">
                <OnlineDot online={onlineUserIds.has(selectedUser.id)} />
                {selectedUser.name}
                <span className="text-xs font-normal text-gray-600">
                  {onlineUserIds.has(selectedUser.id) ? "online" : "offline"}
                </span>
              </h2>

              <MessageList messages={messages} myId={me?.id ?? null} otherUserName={selectedUser.name} />

              {error && <p className="px-4 text-sm text-red-600">{error}</p>}

              <MessageInput placeholder={`Message ${selectedUser.name}`} onSend={sendMessage} />
            </>
          )}
        </section>
      </div>
    </main>
  );
}
