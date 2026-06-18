import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  UIMessage,
} from "ai";

import { TRPG_SYSTEM_PROMPT } from "@/lib/trpg/system-prompt";
import { trpgTools } from "@/lib/trpg/tools";

export const maxDuration = 60;
const DEFAULT_MODEL = "gpt-4o";

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function getTextFromMessage(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("\n");
}

function extractIntakeNameGuide(messages: UIMessage[]): string {
  const firstUserMessage = messages.find((message) => message.role === "user");
  if (!firstUserMessage) return "";

  const text = getTextFromMessage(firstUserMessage);
  const fullName = text.match(/^성명:\s*(.+)$/m)?.[1]?.trim();
  const givenName = text.match(/^이름:\s*(.+)$/m)?.[1]?.trim();

  if (!fullName || !givenName) return "";

  return [
    "",
    "## 현재 플레이어 호칭 규칙",
    `- 플레이어 성명: ${fullName}`,
    `- 플레이어 이름: ${givenName}`,
    '- 서술문에서는 성명이나 이름을 직접 쓰지 말고 "당신"이라고 쓴다.',
    `- 공식 문서·사원증·인사팀 확인은 "${fullName}"을 쓴다.`,
    `- 안면이 트인 NPC 대사는 성을 빼고 "${givenName}님"을 우선한다.`,
  ].join("\n");
}

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return jsonError("OPENAI_API_KEY is not configured.", 500);
  }

  try {
    const { messages }: { messages?: UIMessage[] } = await req.json();

    if (!Array.isArray(messages)) {
      return jsonError("Request body must include a messages array.", 400);
    }

    const result = streamText({
      model: openai(process.env.OPENAI_MODEL ?? DEFAULT_MODEL),
      system: `${TRPG_SYSTEM_PROMPT}${extractIntakeNameGuide(messages)}`,
      messages: await convertToModelMessages(messages, { tools: trpgTools }),
      tools: trpgTools,
      stopWhen: stepCountIs(8),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error", error);
    return jsonError("Failed to start chat response.", 500);
  }
}
