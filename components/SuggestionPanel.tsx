// components/SuggestionPanel.tsx
"use client";
import type { Suggestion, SuggestResponse } from "@/lib/types";

const CROWD_LABEL: Record<Suggestion["crowd_level"], { label: string; color: string }> = {
  low: { label: "空いてる", color: "text-matcha bg-matcha/10" },
  medium: { label: "ほどほど", color: "text-sumi bg-ink/10" },
  high: { label: "混雑あり", color: "text-vermillionDeep bg-vermillion/10" },
};

export function SuggestionPanel({
  data,
  onRestart,
}: {
  data: SuggestResponse;
  onRestart: () => void;
}) {
  return (
    <div className="animate-fade-up">
      <div className="flex items-baseline gap-3 mb-3">
        <span className="hanko inline-block px-2 py-1 text-[11px]">提案</span>
        <div className="font-mincho text-[11px] tracking-[0.3em] text-vermillion">
          GOLDEN WEEK · PLAN
        </div>
      </div>
      <h2 className="font-mincho text-2xl md:text-3xl text-ink leading-snug mb-3">
        あなたの GW に、この 4 つ。
      </h2>
      <p className="text-sumi leading-relaxed mb-6">{data.summary}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.suggestions.map((s, i) => {
          const crowd = CROWD_LABEL[s.crowd_level];
          return (
            <article
              key={`${s.title}-${i}`}
              className="bg-white/85 border border-mist rounded-2xl shadow-paper p-5 flex flex-col gap-3 hover:shadow-[0_18px_36px_-18px_rgba(26,21,18,0.28)] transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="font-mono text-[10px] tracking-[0.28em] text-vermillion uppercase">
                    № {String(i + 1).padStart(2, "0")} · {s.category}
                  </div>
                  <h3 className="font-mincho text-xl text-ink mt-1 leading-tight">
                    {s.title}
                  </h3>
                  <div className="text-[13px] text-faded mt-0.5">{s.area}</div>
                </div>
                <span
                  className={`shrink-0 text-[11px] font-mincho tracking-wider rounded-full px-2.5 py-1 ${crowd.color}`}
                >
                  {crowd.label}
                </span>
              </div>

              <p className="text-[14px] leading-relaxed text-sumi">{s.description}</p>

              <div className="dotted-rule" />

              <div>
                <div className="font-mincho text-[11px] tracking-[0.2em] text-vermillion mb-1">
                  合う理由
                </div>
                <div className="text-[13px] text-sumi leading-relaxed">{s.why_fits}</div>
              </div>

              <div>
                <div className="font-mincho text-[11px] tracking-[0.2em] text-vermillion mb-1">
                  予算目安
                </div>
                <div className="text-[13px] text-sumi font-mono">{s.budget_jpy}</div>
              </div>

              {s.tips.length > 0 && (
                <div>
                  <div className="font-mincho text-[11px] tracking-[0.2em] text-vermillion mb-1.5">
                    Tips
                  </div>
                  <ul className="space-y-1.5">
                    {s.tips.map((t, ti) => (
                      <li
                        key={ti}
                        className="text-[13px] text-sumi pl-3 relative leading-relaxed before:content-['﹅'] before:absolute before:left-0 before:top-0 before:text-vermillion"
                      >
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <div className="mt-8 flex items-center gap-3">
        <button
          onClick={onRestart}
          className="px-5 h-11 rounded-xl border border-ink/30 text-ink font-mincho tracking-[0.14em] text-sm hover:bg-ink hover:text-paper transition"
        >
          もう一度ヒアリング
        </button>
        <span className="text-[12px] text-faded">
          提案が好みと違う場合は、希望を追記して再度ヒアリングできます。
        </span>
      </div>
    </div>
  );
}
