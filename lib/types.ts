// lib/types.ts
// Shared types between client and server.

export type Role = "user" | "assistant";

export interface Message {
  id: string;
  role: Role;
  content: string;
}

/**
 * The four hearing axes. A null value means "not yet filled".
 * Once all four are non-null the phase transitions to `ready_to_suggest`.
 */
export interface Slots {
  /** 場所・エリア (e.g. "都内", "神奈川方面", "伊豆") */
  area: string | null;
  /** 予算・人数・同行者 (e.g. "友人2人, 一人1万円まで") */
  party: string | null;
  /** 混雑回避 (e.g. "穴場志向", "定番でもOK") */
  crowd_pref: string | null;
  /** アクティビティ種別 (e.g. "アウトドア寄り, グルメも") */
  activity_type: string | null;
}

export type Phase = "hearing" | "ready_to_suggest";

export const EMPTY_SLOTS: Slots = {
  area: null,
  party: null,
  crowd_pref: null,
  activity_type: null,
};

export const SLOT_KEYS: Array<keyof Slots> = [
  "area",
  "party",
  "crowd_pref",
  "activity_type",
];

export const SLOT_LABELS: Record<keyof Slots, string> = {
  area: "場所・エリア",
  party: "予算・人数・同行者",
  crowd_pref: "混雑志向",
  activity_type: "アクティビティ種別",
};

/** Response from /api/chat */
export interface ChatResponse {
  reply: string;
  slots: Slots;
  phase: Phase;
}

/** Payload to /api/chat */
export interface ChatRequest {
  messages: Message[];
  slots: Slots;
}

export type CrowdLevel = "low" | "medium" | "high";

export interface Suggestion {
  title: string;
  area: string;
  category: string;
  description: string;
  budget_jpy: string;
  crowd_level: CrowdLevel;
  why_fits: string;
  tips: string[];
}

export interface SuggestResponse {
  summary: string;
  suggestions: Suggestion[];
}

export interface SuggestRequest {
  messages: Message[];
  slots: Slots;
}

export interface ApiError {
  error: string;
}
