"use client";

import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { usePathname } from "next/navigation";
import type { User } from "@/lib/types";
import { useChat } from "@/components/chat/ChatProvider";
import ChatWindow from "@/components/chat/ChatWindow";
import ConversationList from "@/components/chat/ConversationList";

//pages without the dock:
//the /chat page already has the full-screen chat, /authentication/* is for logging in
function isHiddenOn(pathname: string) {
  return pathname === "/chat" || pathname.startsWith("/chat/") || pathname.startsWith("/authentication");
}

//chat on every page (lives in the layout), Facebook-style:
//a "Discussion" bar bottom right that opens the contact list,
//with the open convo window to its left
export default function ChatDock() {
  const { myId, onlineUserIds, contacts, activeContact, unreadCounts, openChatWith } = useChat();
  const [contactsOpen, setContactsOpen] = useState(false);
  //"Discussion" bar button, focus comes back here when Esc closes the list
  const barButtonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  //not logged in, or a page where the chat doesn't belong: no dock
  //(socket stays open in ChatProvider, so we're still online and unreads keep counting)
  if (!myId || isHiddenOn(pathname)) return null;

  const onlineCount = contacts.filter((contact) => onlineUserIds.has(contact.id)).length;
  const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  function selectContact(contact: User) {
    openChatWith(contact);
    setContactsOpen(false);
  }

  //Esc closes the contact list and keeps focus on the bar
  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Escape" || !contactsOpen) return;
    setContactsOpen(false);
    barButtonRef.current?.focus();
  }

  return (
    //on mobile the dock goes full width (left-2) and items shrink to fit side by side;
    //pointer-events-none so the gaps don't block clicks on the page below
    <div className="pointer-events-none fixed right-2 bottom-0 left-2 z-50 flex items-end justify-end gap-2 sm:right-4 sm:left-auto">
      {/* key: a new convo starts with the window open, not minimized */}
      {activeContact && <ChatWindow key={activeContact.id} />}

      <section
        className="pointer-events-auto flex w-64 min-w-0 shrink flex-col overflow-hidden rounded-t-lg border bg-background shadow-lg"
        aria-label="Contacts de discussion"
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
          <span className="min-w-0 flex-1 truncate">
            Discussion ({onlineCount} en ligne)
          </span>
          {totalUnread > 0 && (
            <span
              className="rounded-full bg-red-600 px-2 text-xs text-white"
              aria-label={`${totalUnread} messages non lus`}
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
