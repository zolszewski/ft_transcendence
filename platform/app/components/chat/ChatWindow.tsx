"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { User as UserIcon } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useChat } from "@/components/chat/ChatProvider";
import MessageList from "@/components/chat/MessageList";
import MessageInput from "@/components/chat/MessageInput";
import OnlineDot from "@/components/chat/OnlineDot";

//small convo window docked at the bottom, Facebook-style
//open: header + messages + input; minimized: just the header
//on mobile it goes full screen when open (an 18rem window won't fit next to the bar)
export default function ChatWindow() {
  const { myId, onlineUserIds, activeContact, messages, error, closeChat, sendMessage } = useChat();
  const [minimized, setMinimized] = useState(false);
  //how many messages we'd seen when the window got minimized
  const [seenCount, setSeenCount] = useState(0);
  //header button, focus comes back here when Esc minimizes
  const headerButtonRef = useRef<HTMLButtonElement>(null);

  //ChatDock only renders this when a convo is open
  if (!activeContact) return null;

  //while minimized: new messages from the other person
  const unread = minimized
    ? messages.slice(seenCount).filter((message) => message.senderId !== myId).length
    : 0;
  const online = onlineUserIds.has(activeContact.id);

  function toggleMinimized() {
    if (!minimized) setSeenCount(messages.length);
    setMinimized(!minimized);
  }

  //Esc minimizes (convo stays) and keeps focus on the header
  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Escape" || minimized) return;
    toggleMinimized();
    headerButtonRef.current?.focus();
  }

  const headerLabel = `${activeContact.name}, ${online ? "en ligne" : "hors ligne"}${
    unread > 0 ? `, ${unread} nouveaux messages` : ""
  }`;
  const buttonFocus =
    "rounded-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

  return (
    <section
      className={`pointer-events-auto flex min-w-0 flex-col overflow-hidden rounded-none border border-border bg-background ${
        minimized ? "w-72 shrink" : "fixed inset-0 z-50 h-dvh w-full sm:static sm:h-96 sm:w-72"
      }`}
      aria-label={`Echanger avec ${activeContact.name}`}
      onKeyDown={handleKeyDown}
    >
      {/* header: click to minimize / reopen */}
      <header className="flex items-center gap-2 border-b border-border bg-muted px-3 py-2 text-foreground">
        <button
          ref={headerButtonRef}
          onClick={toggleMinimized}
          className={`flex min-w-0 flex-1 items-center gap-2 text-left font-bold ${buttonFocus}`}
          aria-label={`${minimized ? "Ouvrir" : "Réduire"} l'échange avec ${headerLabel}`}
          aria-expanded={!minimized}
        >
          <OnlineDot online={online} />
          <span className="truncate">{activeContact.name}</span>
          {unread > 0 && (
            <span className="rounded-none bg-red-600 px-2 text-xs text-white">{unread}</span>
          )}
        </button>
        <button onClick={toggleMinimized} className="px-2 py-1 hover:opacity-70" aria-hidden="true" tabIndex={-1}>
          {minimized ? "▲" : "_"}
        </button>
        {/* jump to their profile from the chat */}
        <Link
          href={`/users/${activeContact.id}`}
          className={`px-2 py-1 hover:opacity-70 ${buttonFocus}`}
          aria-label={`Voir le profil de ${activeContact.name}`}
          title="Profil"
        >
          <UserIcon size={16} aria-hidden="true" />
        </Link>
        <button onClick={closeChat} className={`px-2 py-1 hover:opacity-70 ${buttonFocus}`} aria-label="Fermer l'échange">
          ✕
        </button>
      </header>

      {!minimized && (
        <>
          <MessageList messages={messages} myId={myId} otherUserName={activeContact.name} />
          {error && <p className="px-3 text-sm font-bold text-foreground">{error}</p>}
          <MessageInput placeholder={`Message à ${activeContact.name}`} autoFocus onSend={sendMessage} />
        </>
      )}
    </section>
  );
}
