// components/MessageBubble.tsx
"use client";
import type { Message } from "@/lib/types";

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div
      className={`flex animate-fade-up ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] md:max-w-[75%] px-5 py-3.5 leading-relaxed text-[15px] ${
          isUser
            ? "bg-ink text-paper rounded-t-2xl rounded-bl-2xl rounded-br-md"
            : "bg-white/80 text-ink border border-mist rounded-t-2xl rounded-br-2xl rounded-bl-md shadow-paper"
        }`}
      >
        {!isUser && (
          <div className="mb-1.5 flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase text-vermillion font-mincho">
            <span className="inline-block h-1 w-1 rounded-full bg-vermillion" />
            道しるべ
          </div>
        )}
        <div className="whitespace-pre-wrap">{message.content}</div>
      </div>
    </div>
  );
}

export function TypingBubble() {
  return (
    <div className="flex justify-start animate-fade-up">
      <div className="bg-white/80 text-ink border border-mist rounded-t-2xl rounded-br-2xl rounded-bl-md shadow-paper px-5 py-4">
        <div className="flex items-center gap-1.5">
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-faded" />
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-faded" />
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-faded" />
        </div>
      </div>
    </div>
  );
}
