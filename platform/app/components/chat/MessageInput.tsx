"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <form onSubmit={handleSubmit} className="flex gap-2 border-t p-4">
      <Input
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder={placeholder}
        //placeholder isn't enough for screen readers, the input needs a real label
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
