"use client";

import { useEffect, useRef } from "react";
import type { Message } from "@/lib/types";

type MessageListProps = {
  messages: Message[];
  myId: string | null;
  otherUserName: string;
};

//one-line messages (name, time, text), Facebook-style
export default function MessageList({ messages, myId, otherUserName }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  //auto-scroll to the latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    //role="log" + aria-live so screen readers announce new messages
    <div className="flex-1 space-y-2 overflow-y-auto p-4" role="log" aria-live="polite" aria-label="Fil de messages">
      {messages.length === 0 && <p className="text-sm text-gray-600">Pas encore de messages. Dites bonjour !</p>}
      {messages.map((message) => {
        const isMine = message.senderId === myId;
        return (
          <div key={message.id}>
            <p className="text-xs text-foreground">
              <span className="font-bold">{isMine ? "Vous" : otherUserName}</span>{" "}
              {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
            <p className="break-words whitespace-pre-wrap font-bold text-foreground">{message.content}</p>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
