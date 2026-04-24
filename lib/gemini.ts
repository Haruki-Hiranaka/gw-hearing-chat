// lib/gemini.ts
import {
  GoogleGenerativeAI,
  SchemaType,
  type GenerationConfig,
  type Content,
} from "@google/generative-ai";
import type { Message } from "./types";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  // Fail fast at import time in server context.
  // Client never imports this file.
  console.warn("[gemini] GEMINI_API_KEY is not set. API routes will 500.");
}

export const genAI = new GoogleGenerativeAI(apiKey ?? "");

export const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL ?? "gemini-2.5-flash";
export const SUGGEST_MODEL =
  process.env.GEMINI_SUGGEST_MODEL ?? "gemini-2.5-pro";

/** JSON schema for /api/chat turn output. */
export const chatResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    reply: {
      type: SchemaType.STRING,
      description: "ユーザーに見せる自然な返答文。日本語、敬語ベース。",
    },
    slots: {
      type: SchemaType.OBJECT,
      properties: {
        area: { type: SchemaType.STRING, nullable: true },
        party: { type: SchemaType.STRING, nullable: true },
        crowd_pref: { type: SchemaType.STRING, nullable: true },
        activity_type: { type: SchemaType.STRING, nullable: true },
      },
      required: ["area", "party", "crowd_pref", "activity_type"],
    },
    phase: {
      type: SchemaType.STRING,
      enum: ["hearing", "ready_to_suggest"],
      format: "enum",
    },
  },
  required: ["reply", "slots", "phase"],
};

/** JSON schema for /api/suggest output. */
export const suggestResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    summary: { type: SchemaType.STRING },
    suggestions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          area: { type: SchemaType.STRING },
          category: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          budget_jpy: { type: SchemaType.STRING },
          crowd_level: {
            type: SchemaType.STRING,
            enum: ["low", "medium", "high"],
            format: "enum",
          },
          why_fits: { type: SchemaType.STRING },
          tips: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
        },
        required: [
          "title",
          "area",
          "category",
          "description",
          "budget_jpy",
          "crowd_level",
          "why_fits",
          "tips",
        ],
      },
    },
  },
  required: ["summary", "suggestions"],
};

export const chatGenerationConfig: GenerationConfig = {
  temperature: 0.7,
  topP: 0.95,
  maxOutputTokens: 1024,
  responseMimeType: "application/json",
  // Cast is required because SDK's GenerationConfig type does not yet
  // expose responseSchema, but the API honors it.
  responseSchema: chatResponseSchema,
};

export const suggestGenerationConfig: GenerationConfig = {
  temperature: 0.85,
  topP: 0.95,
  maxOutputTokens: 2048,
  responseMimeType: "application/json",
  responseSchema: suggestResponseSchema,
};

/**
 * Convert client Message[] into Gemini `Content[]`.
 * Gemini expects alternating user/model turns; we filter empties defensively.
 */
export function messagesToContents(messages: Message[]): Content[] {
  return messages
    .filter((m) => m.content.trim().length > 0)
    .map<Content>((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));
}

/**
 * Robustly extract a JSON value from model output.
 * Handles: plain JSON, markdown code fences, and text with embedded JSON.
 */
export function extractJSON(raw: string): unknown | null {
  // 1. Try direct parse
  try {
    return JSON.parse(raw);
  } catch {
    // continue
  }

  // 2. Strip markdown code fences (```json ... ``` or ``` ... ```)
  const fenceMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/i);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {
      // continue
    }
  }

  // 3. Find the first { ... } or [ ... ] block (greedy)
  const braceStart = raw.indexOf("{");
  const bracketStart = raw.indexOf("[");
  const start =
    braceStart === -1
      ? bracketStart
      : bracketStart === -1
        ? braceStart
        : Math.min(braceStart, bracketStart);
  if (start !== -1) {
    const closer = raw[start] === "{" ? "}" : "]";
    const end = raw.lastIndexOf(closer);
    if (end > start) {
      try {
        return JSON.parse(raw.slice(start, end + 1));
      } catch {
        // continue
      }
    }
  }

  return null;
}
