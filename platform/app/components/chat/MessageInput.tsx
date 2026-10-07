"use client";

import { useState } from "react";
import type { FormEvent } from "react";

//same limit as the backend (chat.routes.ts)
const MAX_MESSAGE_LENGTH = 2000;

type MessageInputProps = {
  placeholder: string;
  //focus the input right away (chat window just opened)
  autoFocus?: boolean;
  //true if the message went through, then we clear the input
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
    <form onSubmit={handleSubmit} className="flex gap-2 border-t border-border p-4">
      <input
        type="text"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        autoFocus={autoFocus}
        maxLength={MAX_MESSAGE_LENGTH}
        className="field-input min-w-0 flex-1"
      />
      <button type="submit" className="btn-nav shrink-0 disabled:opacity-50" disabled={sending || !content.trim()}>
        Envoyer
      </button>
    </form>
  );
}
