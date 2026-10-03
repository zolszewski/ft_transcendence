"use client";

import { useState } from "react";
import { useChat } from "@/components/chat/ChatProvider";
import MessageList from "@/components/chat/MessageList";
import MessageInput from "@/components/chat/MessageInput";
import OnlineDot from "@/components/chat/OnlineDot";

// petite fenêtre de conversation posée en bas de l'écran, comme le chat de Facebook
// ouverte : en-tête + messages + champ ; réduite : seulement l'en-tête
export default function ChatWindow() {
  const { myId, onlineUserIds, activeContact, messages, error, closeChat, sendMessage } = useChat();
  const [minimized, setMinimized] = useState(false);
  // nombre de messages déjà vus au moment de réduire la fenêtre
  const [seenCount, setSeenCount] = useState(0);

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

  return (
    <section
      className={`flex w-72 flex-col overflow-hidden rounded-t-lg border bg-background shadow-lg ${
        minimized ? "" : "h-96"
      }`}
      aria-label={`Chat with ${activeContact.name}`}
    >
      {/* en-tête : un clic réduit / rouvre la fenêtre */}
      <header className="flex items-center gap-2 bg-primary px-3 py-2 text-primary-foreground">
        <button
          onClick={toggleMinimized}
          className="flex min-w-0 flex-1 items-center gap-2 text-left font-bold"
          aria-label={minimized ? `Open chat with ${activeContact.name}` : `Minimize chat with ${activeContact.name}`}
        >
          <OnlineDot online={online} />
          <span className="truncate">{activeContact.name}</span>
          {unread > 0 && (
            <span className="rounded-full bg-red-600 px-2 text-xs text-white">{unread}</span>
          )}
        </button>
        <button onClick={toggleMinimized} className="px-1 hover:opacity-70" aria-hidden="true" tabIndex={-1}>
          {minimized ? "▲" : "_"}
        </button>
        <button onClick={closeChat} className="px-1 hover:opacity-70" aria-label="Close chat">
          ✕
        </button>
      </header>

      {!minimized && (
        <>
          <MessageList messages={messages} myId={myId} otherUserName={activeContact.name} />
          {error && <p className="px-3 text-sm text-red-600">{error}</p>}
          <MessageInput placeholder={`Message ${activeContact.name}`} onSend={sendMessage} />
        </>
      )}
    </section>
  );
}
