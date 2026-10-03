"use client";

import { useState } from "react";
import type { User } from "@/lib/types";
import { useChat } from "@/components/chat/ChatProvider";
import ChatWindow from "@/components/chat/ChatWindow";
import ConversationList from "@/components/chat/ConversationList";

// le chat présent sur toutes les pages (placé dans le layout), comme celui de Facebook :
// en bas à droite, une barre "Chat" qui ouvre la liste des contacts,
// et à sa gauche la fenêtre de la conversation ouverte
export default function ChatDock() {
  const { myId, onlineUserIds, contacts, activeContact, unreadCounts, openChatWith } = useChat();
  const [contactsOpen, setContactsOpen] = useState(false);

  // pas connecté : pas de chat
  if (!myId) return null;

  const onlineCount = contacts.filter((contact) => onlineUserIds.has(contact.id)).length;
  const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  function selectContact(contact: User) {
    openChatWith(contact);
    setContactsOpen(false);
  }

  return (
    <div className="fixed right-4 bottom-0 z-50 flex items-end gap-2">
      {/* key : une nouvelle conversation repart d'une fenêtre ouverte (pas réduite) */}
      {activeContact && <ChatWindow key={activeContact.id} />}

      <section className="flex w-64 flex-col overflow-hidden rounded-t-lg border bg-background shadow-lg">
        {contactsOpen && (
          <div className="max-h-80 overflow-y-auto border-b" id="chat-contacts">
            <ConversationList
              users={contacts}
              selectedUserId={activeContact?.id ?? null}
              onSelect={selectContact}
            />
          </div>
        )}
        <button
          onClick={() => setContactsOpen(!contactsOpen)}
          className="flex items-center gap-2 bg-primary px-3 py-2 text-left font-bold text-primary-foreground"
          aria-expanded={contactsOpen}
          aria-controls="chat-contacts"
        >
          <span className="flex-1">Chat ({onlineCount} online)</span>
          {totalUnread > 0 && (
            <span
              className="rounded-full bg-red-600 px-2 text-xs text-white"
              aria-label={`${totalUnread} unread messages`}
            >
              {totalUnread}
            </span>
          )}
          <span aria-hidden="true">{contactsOpen ? "▼" : "▲"}</span>
        </button>
      </section>
    </div>
  );
}
