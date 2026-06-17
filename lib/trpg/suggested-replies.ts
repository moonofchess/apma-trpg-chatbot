type MessagePart = {
  type: string;
  state?: string;
  output?: unknown;
};

function isReplyOutput(output: unknown): output is { replies: string[] } {
  return (
    typeof output === "object" &&
    output !== null &&
    "replies" in output &&
    Array.isArray((output as { replies: unknown }).replies)
  );
}

export function extractRepliesFromParts(parts: MessagePart[]): string[] {
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];
    if (
      part.type === "tool-suggestReplies" &&
      part.state === "output-available" &&
      isReplyOutput(part.output)
    ) {
      return part.output.replies.filter((r) => r.trim().length > 0).slice(0, 4);
    }
  }
  return [];
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
