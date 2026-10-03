"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// même limite que le backend (chat.routes.ts)
const MAX_MESSAGE_LENGTH = 2000;

type MessageInputProps = {
  placeholder: string;
  // met le curseur dans le champ dès l'affichage (fenêtre de chat qui s'ouvre)
  autoFocus?: boolean;
  // renvoie true si le message est parti : le champ est alors vidé
  onSend: (content: string) => Promise<boolean>;
};

export default function MessageInput({ placeholder, autoFocus = false, onSend }: MessageInputProps) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!content.trim() || sending) return;

    setSending(true);
    if (await onSend(content)) setContent("");
    setSending(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 border-t p-4">
      <Input
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder={placeholder}
        // le placeholder ne suffit pas aux lecteurs d'écran : il faut un vrai nom au champ
        aria-label={placeholder}
        autoFocus={autoFocus}
        maxLength={MAX_MESSAGE_LENGTH}
      />
      <Button type="submit" disabled={sending || !content.trim()}>
        Send
      </Button>
    </form>
  );
}
