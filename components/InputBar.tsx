// components/InputBar.tsx
"use client";
import { useEffect, useRef, useState } from "react";

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function InputBar({ onSend, disabled, placeholder }: Props) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  const canSend = value.trim().length > 0 && !disabled;

  const submit = () => {
    if (!canSend) return;
    onSend(value.trim());
    setValue("");
  };

  return (
    <div className="border-t border-mist bg-paper/90 backdrop-blur px-4 md:px-8 py-4">
      <div className="max-w-3xl mx-auto flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={placeholder ?? "メッセージを入力…（⌘/Ctrl + Enter で送信）"}
            rows={1}
            disabled={disabled}
            className="w-full resize-none bg-white/70 border border-mist focus:border-ink/40 focus:outline-none rounded-xl px-4 py-3 text-[15px] leading-relaxed text-ink placeholder:text-faded/70 disabled:opacity-50"
          />
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={!canSend}
          className="shrink-0 h-11 px-5 rounded-xl bg-ink text-paper font-mincho tracking-[0.12em] text-sm transition hover:bg-sumi active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          送 る
        </button>
      </div>
    </div>
  );
}
