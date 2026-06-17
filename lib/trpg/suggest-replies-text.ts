const SUGGEST_REPLIES_HEADING =
  /(?:^|\n)\s*(?:suggestReplies|행동\s*제안|추천\s*답변)\s*:?\s*\n/i;

const BULLET_LINE =
  /^\s*[-•*]\s*(?:"([^"]+)"|'([^']+)'|「([^」]+)」|(.+?))\s*$/;

function parseReplyLines(block: string): string[] {
  const replies: string[] = [];

  for (const line of block.split("\n")) {
    const match = line.match(BULLET_LINE);
    if (!match) continue;

    const reply = (match[1] ?? match[2] ?? match[3] ?? match[4])?.trim();
    if (reply) replies.push(reply);
  }

  return replies.slice(0, 3);
}

/** Strip leaked suggestReplies blocks from GM narrative text. */
export function stripSuggestRepliesFromText(text: string): {
  cleanText: string;
  replies: string[];
} {
  const headingMatch = text.match(SUGGEST_REPLIES_HEADING);
  if (!headingMatch || headingMatch.index === undefined) {
    return { cleanText: text, replies: [] };
  }

  const block = text.slice(headingMatch.index + headingMatch[0].length);
  const replies = parseReplyLines(block);
  const cleanText = text.slice(0, headingMatch.index).trimEnd();

  return { cleanText, replies };
}
