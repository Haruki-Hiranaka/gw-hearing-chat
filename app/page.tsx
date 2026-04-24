// app/page.tsx
"use client";
import { useCallback, useMemo, useRef, useState } from "react";
import { ChatView } from "@/components/ChatView";
import { InputBar } from "@/components/InputBar";
import { ProgressRail } from "@/components/ProgressRail";
import { SuggestionPanel } from "@/components/SuggestionPanel";
import {
  EMPTY_SLOTS,
  type ChatRequest,
  type ChatResponse,
  type Message,
  type Phase,
  type Slots,
  type SuggestRequest,
  type SuggestResponse,
} from "@/lib/types";

const INITIAL_GREETING: Message = {
  id: "greet-0",
  role: "assistant",
  content:
    "こんにちは。GW の過ごし方を一緒に考えるお手伝いをします。\nまずは、どの辺りで過ごしたいか教えていただけますか？ 都内でふらっと、近郊で日帰り、いっそ遠出…のどれでも大丈夫です。",
};

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

type UIState =
  | { kind: "chatting" }
  | { kind: "suggesting" } // fetching suggestions
  | { kind: "done"; data: SuggestResponse };

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_GREETING]);
  const [slots, setSlots] = useState<Slots>(EMPTY_SLOTS);
  const [phase, setPhase] = useState<Phase>("hearing");
  const [isLoading, setIsLoading] = useState(false);
  const [ui, setUi] = useState<UIState>({ kind: "chatting" });
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const canSuggest = phase === "ready_to_suggest" && ui.kind === "chatting";

  const sendMessage = useCallback(
    async (text: string) => {
      if (inFlight.current) return;
      inFlight.current = true;
      setError(null);

      const userMsg: Message = { id: uid(), role: "user", content: text };
      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setIsLoading(true);

      try {
        const payload: ChatRequest = { messages: nextMessages, slots };
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }

        const data = (await res.json()) as ChatResponse;
        setSlots(data.slots);
        setPhase(data.phase);
        setMessages((prev) => [
          ...prev,
          { id: uid(), role: "assistant", content: data.reply },
        ]);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
      } finally {
        setIsLoading(false);
        inFlight.current = false;
      }
    },
    [messages, slots]
  );

  const generateSuggestions = useCallback(async () => {
    if (ui.kind !== "chatting") return;
    setUi({ kind: "suggesting" });
    setError(null);

    try {
      const payload: SuggestRequest = { messages, slots };
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as SuggestResponse;
      if (data.suggestions.length === 0) {
        throw new Error("提案の生成に失敗しました（空レスポンス）");
      }
      setUi({ kind: "done", data });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setUi({ kind: "chatting" });
    }
  }, [messages, slots, ui.kind]);

  const restart = useCallback(() => {
    setMessages([INITIAL_GREETING]);
    setSlots(EMPTY_SLOTS);
    setPhase("hearing");
    setUi({ kind: "chatting" });
    setError(null);
  }, []);

  const header = useMemo(
    () => (
      <div className="pb-2">
        <div className="flex items-center gap-3 mb-2">
          <span className="hanko inline-block px-2 py-1 text-[11px]">道しるべ</span>
          <div className="font-mincho text-[11px] tracking-[0.28em] text-vermillion">
            GEMINI CHALLENGE · GW 2026
          </div>
        </div>
        <h1 className="font-mincho text-3xl md:text-4xl leading-tight text-ink">
          対話で決める、<br />
          あなたのゴールデンウィーク。
        </h1>
        <div className="dotted-rule mt-5" />
      </div>
    ),
    []
  );

  const readyCta =
    canSuggest && ui.kind === "chatting" ? (
      <div className="flex flex-col items-start gap-2 bg-vermillion/5 border border-vermillion/25 rounded-2xl p-5 animate-fade-up">
        <div className="font-mincho text-sm text-vermillionDeep tracking-[0.12em]">
          十分な情報が揃いました
        </div>
        <div className="text-sm text-sumi">
          このままヒアリングを続けることもできますし、提案を生成することもできます。
        </div>
        <button
          onClick={generateSuggestions}
          className="mt-1 px-5 h-11 rounded-xl bg-vermillion text-paper font-mincho tracking-[0.12em] text-sm hover:bg-vermillionDeep transition"
        >
          提案を見る →
        </button>
      </div>
    ) : null;

  const suggestingBanner =
    ui.kind === "suggesting" ? (
      <div className="bg-white/70 border border-mist rounded-2xl p-5 animate-fade-up">
        <div className="font-mincho text-sm text-vermillion tracking-[0.12em] mb-1">
          生成中…
        </div>
        <div className="text-sm text-sumi animate-pulse-soft">
          お聞きした内容をもとに、4 つの提案を組み立てています。
        </div>
      </div>
    ) : null;

  const doneFooter =
    ui.kind === "done" ? (
      <div className="pt-4">
        <SuggestionPanel data={ui.data} onRestart={restart} />
      </div>
    ) : null;

  const errorBanner = error ? (
    <div className="bg-vermillion/8 border border-vermillion/30 rounded-xl px-4 py-3 text-sm text-vermillionDeep">
      エラー: {error}
    </div>
  ) : null;

  const placeholder =
    ui.kind === "done"
      ? "もう一度ヒアリングするには、下のボタンを押してください。"
      : canSuggest
        ? "追加で伝えたいことがあれば入力、なければ『提案を見る』へ。"
        : "メッセージを入力…（⌘/Ctrl + Enter で送信）";

  return (
    <main className="h-dvh flex">
      <div className="flex-1 flex flex-col min-w-0">
        <ChatView
          messages={messages}
          isLoading={isLoading}
          header={header}
          footer={
            <>
              {errorBanner}
              {readyCta}
              {suggestingBanner}
              {doneFooter}
            </>
          }
        />
        <InputBar
          onSend={sendMessage}
          disabled={isLoading || ui.kind !== "chatting"}
          placeholder={placeholder}
        />
      </div>
      <ProgressRail slots={slots} />
    </main>
  );
}
