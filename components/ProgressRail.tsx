// components/ProgressRail.tsx
"use client";
import { SLOT_KEYS, SLOT_LABELS, type Slots } from "@/lib/types";

export function ProgressRail({ slots }: { slots: Slots }) {
  const filled = SLOT_KEYS.filter((k) => slots[k] !== null).length;
  const total = SLOT_KEYS.length;

  return (
    <aside className="hidden lg:block w-72 shrink-0 border-l border-mist bg-paper/60 px-6 py-8 overflow-y-auto">
      <div className="font-mincho text-xs tracking-[0.28em] text-vermillion mb-2">
        HEARING
      </div>
      <h2 className="font-mincho text-2xl text-ink mb-1">聞きどころ</h2>
      <div className="text-sm text-faded mb-6">
        {filled} / {total} 埋まりました
      </div>

      <div className="space-y-5">
        {SLOT_KEYS.map((k) => {
          const value = slots[k];
          const isFilled = value !== null;
          return (
            <div key={k} className="relative pl-6">
              <span
                className={`absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 ${
                  isFilled
                    ? "bg-vermillion border-vermillion"
                    : "bg-transparent border-ink/25"
                }`}
              />
              <div className="font-mincho text-[13px] tracking-wider text-ink">
                {SLOT_LABELS[k]}
              </div>
              <div
                className={`text-sm mt-0.5 ${
                  isFilled ? "text-sumi" : "text-faded/70 italic"
                }`}
              >
                {value ?? "ヒアリング中…"}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10 text-[11px] text-faded/80 leading-relaxed">
        <span className="font-mincho text-vermillion">※</span>{" "}
        4 軸すべて埋まると、自動で提案モードに切り替わります。
      </div>
    </aside>
  );
}
