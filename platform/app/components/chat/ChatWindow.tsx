"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { User as UserIcon } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useChat } from "@/components/chat/ChatProvider";
import MessageList from "@/components/chat/MessageList";
import MessageInput from "@/components/chat/MessageInput";
import OnlineDot from "@/components/chat/OnlineDot";

// petite fenêtre de conversation posée en bas de l'écran, comme le chat de Facebook
// ouverte : en-tête + messages + champ ; réduite : seulement l'en-tête
// sur mobile, la fenêtre ouverte prend tout l'écran (une fenêtre de 18rem ne tient pas à côté de la barre)
export default function ChatWindow() {
  const { myId, onlineUserIds, activeContact, messages, error, closeChat, sendMessage } = useChat();
  const [minimized, setMinimized] = useState(false);
  // nombre de messages déjà vus au moment de réduire la fenêtre
  const [seenCount, setSeenCount] = useState(0);
  // bouton de l'en-tête : le focus y revient quand on réduit avec Échap
  const headerButtonRef = useRef<HTMLButtonElement>(null);

  // le ChatDock ne l'affiche que s'il y a une conversation ouverte
  if (!activeContact) return null;

  // pendant que la fenêtre est réduite : les nouveaux messages de l'autre personne
  const unread = minimized
    ? messages.slice(seenCount).filter((message) => message.senderId !== myId).length
    : 0;
  const online = onlineUserIds.has(activeContact.id);

  function toggleMinimized() {
    if (!minimized) setSeenCount(messages.length);
    setMinimized(!minimized);
  }

  // Échap réduit la fenêtre (sans perdre la conversation) et laisse le focus clavier sur l'en-tête
  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Escape" || minimized) return;
    toggleMinimized();
    headerButtonRef.current?.focus();
  }

  const headerLabel = `${activeContact.name}, ${online ? "online" : "offline"}${
    unread > 0 ? `, ${unread} new messages` : ""
  }`;
  const buttonFocus = "rounded focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

  return (
    <section
      className={`pointer-events-auto flex min-w-0 flex-col overflow-hidden border bg-background shadow-lg ${
        minimized
          ? "w-72 shrink rounded-t-lg"
          : "fixed inset-0 z-50 h-dvh w-full sm:static sm:h-96 sm:w-72 sm:rounded-t-lg"
      }`}
      aria-label={`Chat with ${activeContact.name}`}
      onKeyDown={handleKeyDown}
    >
      {/* en-tête : un clic réduit / rouvre la fenêtre */}
      <header className="flex items-center gap-2 bg-primary px-3 py-2 text-primary-foreground">
        <button
          ref={headerButtonRef}
          onClick={toggleMinimized}
          className={`flex min-w-0 flex-1 items-center gap-2 text-left font-bold ${buttonFocus}`}
          aria-label={`${minimized ? "Open" : "Minimize"} chat with ${headerLabel}`}
          aria-expanded={!minimized}
        >
          <OnlineDot online={online} />
          <span className="truncate">{activeContact.name}</span>
          {unread > 0 && (
            <span className="rounded-full bg-red-600 px-2 text-xs text-white">{unread}</span>
          )}
        </button>
        <button onClick={toggleMinimized} className="px-2 py-1 hover:opacity-70" aria-hidden="true" tabIndex={-1}>
          {minimized ? "▲" : "_"}
        </button>
        {/* accès au profil depuis le chat */}
        <Link
          href={`/users/${activeContact.id}`}
          className={`px-2 py-1 hover:opacity-70 ${buttonFocus}`}
          aria-label={`View ${activeContact.name}'s profile`}
          title="Profile"
        >
          <UserIcon size={16} aria-hidden="true" />
        </Link>
        <button onClick={closeChat} className={`px-2 py-1 hover:opacity-70 ${buttonFocus}`} aria-label="Close chat">
          ✕
        </button>
      </header>

      {!minimized && (
        <>
          <MessageList messages={messages} myId={myId} otherUserName={activeContact.name} />
          {error && <p className="px-3 text-sm text-red-600">{error}</p>}
          <MessageInput placeholder={`Message ${activeContact.name}`} autoFocus onSend={sendMessage} />
        </>
      )}
    </section>
  );
}
