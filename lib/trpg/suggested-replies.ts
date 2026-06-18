import { stripSuggestRepliesFromText } from "./suggest-replies-text";
import type { ChapterInfo } from "./employee-profile";

type MessagePart = {
  type: string;
  text?: string;
  state?: string;
  input?: unknown;
  output?: unknown;
};

function normalizeReplies(replies: string[]): string[] {
  return replies.map((r) => r.trim()).filter((r) => r.length > 0).slice(0, 3);
}

function isReplyPayload(value: unknown): value is { replies: string[] } {
  return (
    typeof value === "object" &&
    value !== null &&
    "replies" in value &&
    Array.isArray((value as { replies: unknown }).replies)
  );
}

function extractFromToolPart(part: MessagePart): string[] {
  if (part.type !== "tool-suggestReplies") return [];

  if (part.state === "output-available" && isReplyPayload(part.output)) {
    return normalizeReplies(part.output.replies);
  }

  if (
    (part.state === "input-available" || part.state === "input-streaming") &&
    isReplyPayload(part.input)
  ) {
    return normalizeReplies(part.input.replies);
  }

  return [];
}

function extractFromTextParts(parts: MessagePart[]): string[] {
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];
    if (part.type !== "text" || !part.text) continue;

    const { replies } = stripSuggestRepliesFromText(part.text);
    if (replies.length > 0) return replies;
  }

  return [];
}

export function extractRepliesFromParts(parts: MessagePart[]): string[] {
  for (let i = parts.length - 1; i >= 0; i--) {
    const replies = extractFromToolPart(parts[i]);
    if (replies.length > 0) return replies;
  }

  return extractFromTextParts(parts);
}

export function extractLatestSuggestedReplies(
  messages: { role: string; parts: MessagePart[] }[],
): string[] {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role !== "assistant") continue;
    const replies = extractRepliesFromParts(messages[i].parts);
    if (replies.length > 0) return replies;
  }
  return [];
}

export function buildFallbackSuggestedReplies(chapter: ChapterInfo | null): string[] {
  const title = chapter?.title ?? "";

  if (title.includes("복사기") || title.includes("첫 출근") || title.includes("오리엔테이션")) {
    return [
      "신분증을 꺼내 절차대로 제출한다",
      "박도윤 대리에게 복사기 상태를 조심스럽게 묻는다",
      "피가 번지는 복사기 쪽으로 한 걸음 다가간다",
    ];
  }

  if (title.includes("야근") || title.includes("식대")) {
    return [
      "영수증 내용을 다시 확인한다",
      "박도윤 대리에게 시간외근무 기안서를 묻는다",
      "사무실 문이 잠겼는지 확인한다",
    ];
  }

  if (title.includes("외근") || title.includes("현장")) {
    return [
      "김세린 과장의 지시에 맞춰 장비를 확인한다",
      "현장 규칙을 한 번 더 물어본다",
      "폴리스 라인 너머의 침묵을 살핀다",
    ];
  }

  if (title.includes("영수증") || title.includes("재구성")) {
    return [
      "찢어진 방호복 사진을 증빙으로 첨부한다",
      "한지우 주임에게 반려 사유를 묻는다",
      "박도윤 대리와 사유서 문구를 다시 짠다",
    ];
  }

  if (title.includes("7층") || title.includes("분실물")) {
    return [
      "엘리베이터 버튼 표시를 확인한다",
      "박도윤 대리에게 방금 본 것을 말한다",
      "임시직이 건넨 사원증을 받아 든다",
    ];
  }

  return [
    "절차대로 필요한 서류를 확인한다",
    "눈앞의 이상한 점을 NPC에게 묻는다",
    "다음 결재 단계로 움직인다",
  ];
}
