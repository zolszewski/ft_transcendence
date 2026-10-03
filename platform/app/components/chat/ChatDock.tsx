"use client";

import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { usePathname } from "next/navigation";
import type { User } from "@/lib/types";
import { useChat } from "@/components/chat/ChatProvider";
import ChatWindow from "@/components/chat/ChatWindow";
import ConversationList from "@/components/chat/ConversationList";

// pages où le dock ne s'affiche pas :
// /chat a déjà le chat en plein écran (sinon doublon), /authentication/* sert à se connecter
function isHiddenOn(pathname: string) {
  return pathname === "/chat" || pathname.startsWith("/chat/") || pathname.startsWith("/authentication");
}

// le chat présent sur toutes les pages (placé dans le layout), comme celui de Facebook :
// en bas à droite, une barre "Chat" qui ouvre la liste des contacts,
// et à sa gauche la fenêtre de la conversation ouverte
export default function ChatDock() {
  const { myId, onlineUserIds, contacts, activeContact, unreadCounts, openChatWith } = useChat();
  const [contactsOpen, setContactsOpen] = useState(false);
  // bouton de la barre "Chat" : le focus y revient quand on ferme la liste avec Échap
  const barButtonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  // pas connecté, ou page où le chat n'a pas sa place : pas de dock
  // (la socket reste ouverte dans le ChatProvider : on reste "en ligne" et les non-lus continuent de compter)
  if (!myId || isHiddenOn(pathname)) return null;

  const onlineCount = contacts.filter((contact) => onlineUserIds.has(contact.id)).length;
  const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  function selectContact(contact: User) {
    openChatWith(contact);
    setContactsOpen(false);
  }

  // Échap referme la liste des contacts et laisse le focus clavier sur la barre
  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Escape" || !contactsOpen) return;
    setContactsOpen(false);
    barButtonRef.current?.focus();
  }

  return (
    // sur mobile le dock prend toute la largeur (left-2) et ses éléments rétrécissent (shrink) pour tenir côte à côte ;
    // pointer-events-none : l'espace vide entre eux ne bloque pas les clics sur la page en dessous
    <div className="pointer-events-none fixed right-2 bottom-0 left-2 z-50 flex items-end justify-end gap-2 sm:right-4 sm:left-auto">
      {/* key : une nouvelle conversation repart d'une fenêtre ouverte (pas réduite) */}
      {activeContact && <ChatWindow key={activeContact.id} />}

      <section
        className="pointer-events-auto flex w-64 min-w-0 shrink flex-col overflow-hidden rounded-t-lg border bg-background shadow-lg"
        aria-label="Chat contacts"
        onKeyDown={handleKeyDown}
      >
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
          ref={barButtonRef}
          onClick={() => setContactsOpen(!contactsOpen)}
          className="flex items-center gap-2 bg-primary px-3 py-2 text-left font-bold text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
          aria-expanded={contactsOpen}
          aria-controls="chat-contacts"
        >
          <span className="min-w-0 flex-1 truncate">Chat ({onlineCount} online)</span>
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
