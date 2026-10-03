"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";

type ChatContextValue = {
  // ids des utilisateurs connectés, tenus à jour par la socket
  onlineUserIds: Set<string>;
};

const ChatContext = createContext<ChatContextValue | null>(null);

type ChatProviderProps = {
  // utilisateur connecté (lu par le layout côté serveur), null si personne
  userId: string | null;
  children: React.ReactNode;
};

// placé dans le layout : une seule connexion socket pour tout le site,
// qui reste ouverte quand on change de page (le layout ne se recharge pas)
export function ChatProvider({ userId, children }: ChatProviderProps) {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  // se (re)connecte quand l'utilisateur change : login, logout, changement de compte
  useEffect(() => {
    if (!userId) return;
    const socket = getSocket();

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

    socket.on("users:online", handleOnlineList);
    socket.on("user:online", handleUserOnline);
    socket.on("user:offline", handleUserOffline);
    socket.connect();
    return () => {
      socket.off("users:online", handleOnlineList);
      socket.off("user:online", handleUserOnline);
      socket.off("user:offline", handleUserOffline);
      socket.disconnect();
      // après un logout, plus personne n'est affiché en ligne
      setOnlineUserIds(new Set());
    };
  }, [userId]);

  return <ChatContext.Provider value={{ onlineUserIds }}>{children}</ChatContext.Provider>;
}

// à utiliser dans n'importe quel composant sous le layout : useOnlineUsers().has(user.id)
export function useOnlineUsers(): Set<string> {
  const context = useContext(ChatContext);
  if (!context)
    throw new Error("useOnlineUsers must be used inside <ChatProvider>");
  return context.onlineUserIds;
}
