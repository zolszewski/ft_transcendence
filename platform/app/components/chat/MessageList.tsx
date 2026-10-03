"use client";

import { useEffect, useRef } from "react";
import type { Message } from "@/lib/types";

type MessageListProps = {
  messages: Message[];
  myId: string | null;
  otherUserName: string;
};

// messages en lignes simples (nom, heure, texte), comme le chat de Facebook
export default function MessageList({ messages, myId, otherUserName }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // descend automatiquement au dernier message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    // role="log" + aria-live : les lecteurs d'écran annoncent les nouveaux messages
    <div className="flex-1 space-y-2 overflow-y-auto p-4" role="log" aria-live="polite" aria-label="Messages">
      {messages.length === 0 && <p className="text-sm text-gray-600">No messages yet. Say hello!</p>}
      {messages.map((message) => {
        const isMine = message.senderId === myId;
        return (
          <div key={message.id}>
            <p className="text-xs text-gray-600">
              <span className={`font-bold ${isMine ? "text-primary" : "text-foreground"}`}>
                {isMine ? "You" : otherUserName}
              </span>{" "}
              {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
            <p className="break-words whitespace-pre-wrap">{message.content}</p>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
