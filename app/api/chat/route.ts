// app/api/chat/route.ts
import { NextResponse } from "next/server";
import {
  CHAT_MODEL,
  chatGenerationConfig,
  extractJSON,
  genAI,
  messagesToContents,
} from "@/lib/gemini";
import { HEARING_SYSTEM_PROMPT, formatSlotsForUser } from "@/lib/prompts";
import type {
  ChatRequest,
  ChatResponse,
  Phase,
  Slots,
} from "@/lib/types";
import { EMPTY_SLOTS, SLOT_KEYS } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Accept only strict shape; reject anything else. */
function parseBody(raw: unknown): ChatRequest | null {
  if (!raw || typeof raw !== "object") return null;
  const body = raw as Record<string, unknown>;
  if (!Array.isArray(body.messages)) return null;
  // Shallow validation; deep validation can be added with zod later.
  return {
    messages: body.messages as ChatRequest["messages"],
    slots: (body.slots as Slots) ?? EMPTY_SLOTS,
  };
}

/** Coerce model output into a valid ChatResponse with safe fallbacks. */
function normalizeResponse(parsed: unknown, prevSlots: Slots): ChatResponse {
  const obj = (parsed ?? {}) as Record<string, unknown>;
  const modelSlots = (obj.slots ?? {}) as Partial<Slots>;

  // Merge: model output takes precedence, but never reset a filled slot to null.
  const slots: Slots = { ...prevSlots };
  for (const key of SLOT_KEYS) {
    const v = modelSlots[key];
    if (typeof v === "string" && v.trim().length > 0) {
      slots[key] = v.trim();
    }
  }

  // Derive phase: if all slots filled, force ready_to_suggest even if model
  // forgot to transition.
  const allFilled = SLOT_KEYS.every((k) => slots[k] !== null);
  const modelPhase = obj.phase as Phase | undefined;
  const phase: Phase =
    modelPhase === "ready_to_suggest" || allFilled
      ? "ready_to_suggest"
      : "hearing";

  const reply =
    typeof obj.reply === "string" && obj.reply.trim().length > 0
      ? obj.reply
      : "すみません、もう一度教えてください。";

  return { reply, slots, phase };
}

export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  let body: ChatRequest | null;
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
      model: CHAT_MODEL,
      systemInstruction: `${HEARING_SYSTEM_PROMPT}\n\n${formatSlotsForUser(slots)}`,
      generationConfig: chatGenerationConfig,
    });

    const result = await model.generateContent({
      contents: messagesToContents(messages),
    });

    const raw = result.response.text();
    const parsed = extractJSON(raw);
    if (parsed === null) {
      console.error("[/api/chat] non-JSON output:", raw.slice(0, 800));
      return NextResponse.json(
        { error: "Model returned non-JSON output." },
        { status: 502 }
      );
    }

    const normalized = normalizeResponse(parsed, slots);
    return NextResponse.json(normalized satisfies ChatResponse);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/chat]", msg);
    return NextResponse.json(
      { error: `Gemini API call failed: ${msg}` },
      { status: 500 }
    );
  }
}
