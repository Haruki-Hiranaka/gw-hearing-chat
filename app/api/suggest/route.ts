// app/api/suggest/route.ts
import { NextResponse } from "next/server";
import {
  SUGGEST_MODEL,
  extractJSON,
  genAI,
  messagesToContents,
  suggestGenerationConfig,
} from "@/lib/gemini";
import { SUGGEST_SYSTEM_PROMPT, formatSlotsForUser } from "@/lib/prompts";
import type {
  CrowdLevel,
  SuggestRequest,
  SuggestResponse,
  Suggestion,
  Slots,
} from "@/lib/types";
import { EMPTY_SLOTS } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function parseBody(raw: unknown): SuggestRequest | null {
  if (!raw || typeof raw !== "object") return null;
  const body = raw as Record<string, unknown>;
  if (!Array.isArray(body.messages)) return null;
  return {
    messages: body.messages as SuggestRequest["messages"],
    slots: (body.slots as Slots) ?? EMPTY_SLOTS,
  };
}

const CROWD_LEVELS: readonly CrowdLevel[] = ["low", "medium", "high"];

function sanitizeSuggestion(raw: unknown): Suggestion | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Record<string, unknown>;
  const level = CROWD_LEVELS.includes(s.crowd_level as CrowdLevel)
    ? (s.crowd_level as CrowdLevel)
    : "medium";
  const tips = Array.isArray(s.tips)
    ? s.tips.filter((t): t is string => typeof t === "string")
    : [];
  const fields: Array<keyof Omit<Suggestion, "crowd_level" | "tips">> = [
    "title",
    "area",
    "category",
    "description",
    "budget_jpy",
    "why_fits",
  ];
  const out: Partial<Suggestion> = { crowd_level: level, tips };
  for (const f of fields) {
    const v = s[f];
    if (typeof v !== "string" || v.trim().length === 0) return null;
    (out[f] as string) = v;
  }
  return out as Suggestion;
}

function normalize(parsed: unknown): SuggestResponse {
  const obj = (parsed ?? {}) as Record<string, unknown>;
  const summary =
    typeof obj.summary === "string" ? obj.summary : "ご希望に沿った提案をまとめました。";
  const rawList = Array.isArray(obj.suggestions) ? obj.suggestions : [];
  const suggestions = rawList
    .map(sanitizeSuggestion)
    .filter((s): s is Suggestion => s !== null);
  return { summary, suggestions };
}

export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  let body: SuggestRequest | null;
  try {
    body = parseBody(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!body) {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const { messages, slots } = body;

  try {
    const model = genAI.getGenerativeModel({
      model: SUGGEST_MODEL,
      systemInstruction: `${SUGGEST_SYSTEM_PROMPT}\n\n${formatSlotsForUser(slots)}`,
      generationConfig: suggestGenerationConfig,
    });

    // We pass the full history so the model has all the nuance, not just slots.
    const result = await model.generateContent({
      contents: [
        ...messagesToContents(messages),
        {
          role: "user",
          parts: [
            {
              text:
                "上記のヒアリング内容を踏まえて、GW の過ごし方の提案を 4 件生成してください。",
            },
          ],
        },
      ],
    });

    const raw = result.response.text();
    const parsed = extractJSON(raw);
    if (parsed === null) {
      console.error("[/api/suggest] non-JSON output:", raw.slice(0, 800));
      return NextResponse.json(
        { error: "Model returned non-JSON output." },
        { status: 502 }
      );
    }

    return NextResponse.json(normalize(parsed) satisfies SuggestResponse);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/suggest]", msg);
    return NextResponse.json(
      { error: `Gemini API call failed: ${msg}` },
      { status: 500 }
    );
  }
}
