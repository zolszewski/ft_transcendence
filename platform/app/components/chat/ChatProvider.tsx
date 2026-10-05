"use client";

//coté navigateur. ca doit etre en temps réel pour mettre a jour l interface

//le fichier layout permet de garder la structure du chat partout sur toutes les pages et le fichiers providerchat contient tout l etat du chat 
// (les contactes; les messages, le conversionation) il gere aussi le temps réel etc.

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { getSocket } from "@/lib/socket";
import type { Message, User } from "@/lib/types";

//import les outils react

// message reçu par la socket : le back ajoute le destinataire pour savoir de quelle conversation il s'agit
type SocketMessage = Message & { recipientId: string };

//le minimum pour ouvrir une conversation (un User complet convient aussi)
export type ChatContact = Pick<User, "id" | "name">;


//décris tout le système du chat
type ChatContextValue = {
  // l'utilisateur connecté (null si personne)
  myId: string | null;
  // ids des utilisateurs connectés, tenus à jour par la socket
  onlineUserIds: Set<string>;
  // les autres utilisateurs, à qui on peut écrire
  contacts: User[];
  // la conversation ouverte (null = aucune)
  activeContact: ChatContact | null;
  // les messages de la conversation ouverte
  messages: Message[];
  // nombre de messages non lus par contact (id -> nombre)
  unreadCounts: Record<string, number>;
  error: string;
  openChatWith: (contact: ChatContact) => void;
  closeChat: () => void;
  // renvoie true si le message est parti
  sendMessage: (content: string) => Promise<boolean>;
};

const ChatContext = createContext<ChatContextValue | null>(null);

type ChatProviderProps = {
  // utilisateur connecté (lu par le layout côté serveur), null si personne
  userId: string | null;
  children: React.ReactNode;
};

// le même message peut arriver deux fois (réponse du POST + socket) : on ne l'ajoute qu'une fois
function appendOnce(messages: Message[], message: Message) {
  return messages.some((existing) => existing.id === message.id) ? messages : [...messages, message];
}


//useState : pour stocker les infos du chat (contacts, messages, etc)
// et qauns ca change REact peut les modifier
// placé dans le layout : une seule connexion socket pour tout le site,
// qui reste ouverte quand on change de page (le layout ne se recharge pas)
export function ChatProvider({ userId, children }: ChatProviderProps) {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [contacts, setContacts] = useState<User[]>([]);
  const [activeContact, setActiveContact] = useState<ChatContact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  // copie de activeContact lisible depuis le listener socket (sinon il garderait l'ancienne valeur)
  const activeContactRef = useRef<ChatContact | null>(null);
  const activeContactId = activeContact?.id ?? null;


  //Websocket permet le temps réel
  //useEffect: quand un user met à jour le chat
  // se (re)connecte quand l'utilisateur change : login, logout, changement de compte
  useEffect(() => {
    if (!userId) return;
    const socket = getSocket();
    let cancelled = false;

    apiClient.chat.listUsers().then((response) => {
      if (cancelled) return;
      if (response.success) setContacts(response.data);
      else setError(response.error);
    });

    // à la connexion : la liste complète de ceux qui sont déjà en ligne
    function handleOnlineList(userIds: string[]) {
      setOnlineUserIds(new Set(userIds));
    }

    // ensuite : un user qui arrive ou qui part
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
      // l'autre personne de la conversation : l'expéditeur, ou le destinataire si j'ai écrit depuis un autre onglet
      const otherUserId = message.senderId === userId ? message.recipientId : message.senderId;
      if (activeContactRef.current?.id === otherUserId) {
        setMessages((previous) => appendOnce(previous, message));
        return;
      }
      // conversation pas ouverte : un non-lu de plus (sauf pour mes propres messages)
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
      // après un logout, on oublie tout ce qui concernait l'ancien utilisateur
      activeContactRef.current = null;
      setOnlineUserIds(new Set());
      setContacts([]);
      setActiveContact(null);
      setMessages([]);
      setUnreadCounts({});
      setError("");
    };
  }, [userId]);

  // à chaque changement de conversation : charger ses messages
  useEffect(() => {
    if (!activeContactId) return;
    // ignore la réponse si on a changé de conversation entre-temps
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
    // ouvrir la conversation = tout est lu
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
    // la conversation a pu changer pendant l'envoi : n'ajoute le message que si c'est toujours la même
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

// tout l'état du chat, pour la chatbox et la page /chat
export function useChat(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context)
    throw new Error("useChat must be used inside <ChatProvider>");
  return context;
}

// à utiliser dans n'importe quel composant sous le layout : useOnlineUsers().has(user.id)
export function useOnlineUsers(): Set<string> {
  return useChat().onlineUserIds;
}

// 