"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/apiClient";
import { getSocket } from "@/lib/socket";
import type { Message, User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MAX_MESSAGE_LENGTH = 2000;

// message reçu par la socket : le back ajoute le destinataire pour savoir de quelle conversation il s'agit
type SocketMessage = Message & { recipientId: string };

export default function ChatPage() {
  const [me, setMe] = useState<User | null>(null);
  const [notLoggedIn, setNotLoggedIn] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  // ids des utilisateurs connectés, tenus à jour par la socket
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);
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

  // temps réel : connexion socket une fois l'utilisateur connu, écoute des nouveaux messages
  useEffect(() => {
    if (!me) return;
    const socket = getSocket();

    function handleNewMessage(message: SocketMessage) {
      const current = selectedUserRef.current;
      // n'affiche que les messages de la conversation ouverte
      if (!current || (message.senderId !== current.id && message.recipientId !== current.id)) return;
      addMessage(message);
    }

    // à la connexion : la liste complète de ceux qui sont déjà en ligne
    function handleOnlineList(userIds: string[]) {
      setOnlineUserIds(new Set(userIds));
    }

    // ensuite : un user qui arrive ou qui part
    function handleUserOnline(userId: string) {
      setOnlineUserIds((previous) => new Set(previous).add(userId));
    }

    function handleUserOffline(userId: string) {
      setOnlineUserIds((previous) => {
        const next = new Set(previous);
        next.delete(userId);
        return next;
      });
    }

    socket.on("message:new", handleNewMessage);
    socket.on("users:online", handleOnlineList);
    socket.on("user:online", handleUserOnline);
    socket.on("user:offline", handleUserOffline);
    socket.connect();
    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("users:online", handleOnlineList);
      socket.off("user:online", handleUserOnline);
      socket.off("user:offline", handleUserOffline);
      socket.disconnect();
    };
  }, [me]);

  // descend automatiquement au dernier message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedUser || !content.trim() || sending) return;

    setSending(true);
    setError("");
    const response = await apiClient.chat.sendMessage(selectedUser.id, content);
    if (response.success) {
      addMessage(response.data);
      setContent("");
    } else {
      setError(response.error);
    }
    setSending(false);
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
          {users.length === 0 && <p className="p-4 text-sm text-gray-600">No other users yet.</p>}
          <ul>
            {users.map((user) => (
              <li key={user.id}>
                <button
                  onClick={() => selectUser(user)}
                  className={`flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-muted ${
                    selectedUser?.id === user.id ? "bg-muted font-bold" : ""
                  }`}
                >
                  <OnlineDot online={onlineUserIds.has(user.id)} />
                  {user.name}
                </button>
              </li>
            ))}
          </ul>
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

              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {messages.length === 0 && (
                  <p className="text-sm text-gray-600">No messages yet. Say hello!</p>
                )}
                {messages.map((message) => {
                  const isMine = message.senderId === me?.id;
                  return (
                    <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[70%] rounded-lg px-3 py-2 ${
                          isMine ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        <p className="text-xs font-bold opacity-70">{isMine ? "You" : selectedUser.name}</p>
                        <p className="break-words whitespace-pre-wrap">{message.content}</p>
                        <p className="mt-1 text-right text-xs opacity-70">
                          {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {error && <p className="px-4 text-sm text-red-600">{error}</p>}

              <form onSubmit={handleSubmit} className="flex gap-2 border-t p-4">
                <Input
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder={`Message ${selectedUser.name}`}
                  maxLength={MAX_MESSAGE_LENGTH}
                />
                <Button type="submit" disabled={sending || !content.trim()}>
                  Send
                </Button>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

// pastille verte si en ligne, grise sinon
function OnlineDot({ online }: { online: boolean }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${online ? "bg-green-500" : "bg-gray-300"}`}
      title={online ? "online" : "offline"}
    />
  );
}
