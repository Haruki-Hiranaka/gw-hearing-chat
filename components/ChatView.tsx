// components/ChatView.tsx
"use client";
import { useEffect, useRef } from "react";
import type { Message } from "@/lib/types";
import { MessageBubble, TypingBubble } from "./MessageBubble";

export function ChatView({
  messages,
  isLoading,
  header,
  footer,
}: {
  messages: Message[];
  isLoading: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading, footer]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 space-y-5">
        {header}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {isLoading && <TypingBubble />}
        {footer}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
