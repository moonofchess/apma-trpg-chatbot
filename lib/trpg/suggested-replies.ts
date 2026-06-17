import { stripSuggestRepliesFromText } from "./suggest-replies-text";

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
