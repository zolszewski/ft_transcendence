"use client";

//client-side chat state (contacts, messages, open convo) + the realtime stuff

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { getSocket } from "@/lib/socket";
import type { Message, User } from "@/lib/types";

//socket message: the back adds the recipient so we know which convo it's for
type SocketMessage = Message & { recipientId: string };

//bare minimum to open a convo (a full User works too)
export type ChatContact = Pick<User, "id" | "name">;


//everything the chat exposes
type ChatContextValue = {
  //logged-in user (null if nobody)
  myId: string | null;
  //ids of online users, kept in sync by the socket
  onlineUserIds: Set<string>;
  //everyone else, i.e. people you can message
  contacts: User[];
  //open convo (null = none)
  activeContact: ChatContact | null;
  //messages of the open convo
  messages: Message[];
  //unread count per contact (id -> count)
  unreadCounts: Record<string, number>;
  error: string;
  openChatWith: (contact: ChatContact) => void;
  closeChat: () => void;
  //true if the message went through
  sendMessage: (content: string) => Promise<boolean>;
};

const ChatContext = createContext<ChatContextValue | null>(null);

type ChatProviderProps = {
  //logged-in user (read server-side by the layout), null if nobody
  userId: string | null;
  children: React.ReactNode;
};

//same message can land twice (POST response + socket), only keep one
function appendOnce(messages: Message[], message: Message) {
  return messages.some((existing) => existing.id === message.id) ? messages : [...messages, message];
}


//lives in the layout: one socket for the whole site,
//stays open across page changes (the layout doesn't remount)
export function ChatProvider({ userId, children }: ChatProviderProps) {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [contacts, setContacts] = useState<User[]>([]);
  const [activeContact, setActiveContact] = useState<ChatContact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  //activeContact mirror for the socket listener (otherwise it'd see a stale value)
  const activeContactRef = useRef<ChatContact | null>(null);
  const activeContactId = activeContact?.id ?? null;


  //(re)connect whenever the user changes: login, logout, account switch
  useEffect(() => {
    if (!userId) return;
    const socket = getSocket();
    let cancelled = false;

    apiClient.chat.listUsers().then((response) => {
      if (cancelled) return;
      if (response.success) setContacts(response.data);
      else setError(response.error);
    });

    //on connect: full list of who's already online
    function handleOnlineList(userIds: string[]) {
      setOnlineUserIds(new Set(userIds));
    }

    //then: someone comes or goes
    function handleUserOnline(onlineUserId: string) {
      setOnlineUserIds((previous) => new Set(previous).add(onlineUserId));
    }

    function handleUserOffline(offlineUserId: string) {
      setOnlineUserIds((previous) => {
        const next = new Set(previous);
        next.delete(offlineUserId);
        return next;
      });
    }

    function handleNewMessage(message: SocketMessage) {
      //the other person in the convo: the sender, or the recipient if I sent it from another tab
      const otherUserId = message.senderId === userId ? message.recipientId : message.senderId;
      if (activeContactRef.current?.id === otherUserId) {
        setMessages((previous) => appendOnce(previous, message));
        return;
      }
      //convo not open: one more unread (unless it's my own message)
      if (message.senderId !== userId)
        setUnreadCounts((previous) => ({ ...previous, [otherUserId]: (previous[otherUserId] ?? 0) + 1 }));
    }

    socket.on("users:online", handleOnlineList);
    socket.on("user:online", handleUserOnline);
    socket.on("user:offline", handleUserOffline);
    socket.on("message:new", handleNewMessage);
    socket.connect();
    return () => {
      cancelled = true;
      socket.off("users:online", handleOnlineList);
      socket.off("user:online", handleUserOnline);
      socket.off("user:offline", handleUserOffline);
      socket.off("message:new", handleNewMessage);
      socket.disconnect();
      //after logout, forget everything about the previous user
      activeContactRef.current = null;
      setOnlineUserIds(new Set());
      setContacts([]);
      setActiveContact(null);
      setMessages([]);
      setUnreadCounts({});
      setError("");
    };
  }, [userId]);
  //convo changed: load its messages
  useEffect(() => {
    if (!activeContactId) return;
    //drop the response if the convo changed meanwhile
    let cancelled = false;
    apiClient.chat.getMessages(activeContactId).then((response) => {
      if (cancelled) return;
      if (response.success) setMessages(response.data);
      else setError(response.error);
    });
    return () => {
      cancelled = true;
    };
  }, [activeContactId]);

  function openChatWith(contact: ChatContact) {
    if (activeContactRef.current?.id !== contact.id) setMessages([]);
    activeContactRef.current = contact;
    setActiveContact(contact);
    setError("");
    //opening the convo = everything's read
    setUnreadCounts((previous) => {
      const next = { ...previous };
      delete next[contact.id];
      return next;
    });
  }

  function closeChat() {
    activeContactRef.current = null;
    setActiveContact(null);
    setMessages([]);
    setError("");
  }

  async function sendMessage(content: string) {
    const recipient = activeContactRef.current;
    if (!recipient) return false;
    setError("");
    const response = await apiClient.chat.sendMessage(recipient.id, content);
    if (!response.success) {
      setError(response.error);
      return false;
    }
    //convo might've changed while sending, only append if it's still the same one
    if (activeContactRef.current?.id === recipient.id)
      setMessages((previous) => appendOnce(previous, response.data));
    return true;
  }

  return (
    <ChatContext.Provider
      value={{
        myId: userId,
        onlineUserIds,
        contacts,
        activeContact,
        messages,
        unreadCounts,
        error,
        openChatWith,
        closeChat,
        sendMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

//all the chat state, for the chat box and the /chat page
export function useChat(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context)
    throw new Error("useChat must be used inside <ChatProvider>");
  return context;
}

//use it anywhere under the layout: useOnlineUsers().has(user.id)
export function useOnlineUsers(): Set<string> {
  return useChat().onlineUserIds;
}

// 