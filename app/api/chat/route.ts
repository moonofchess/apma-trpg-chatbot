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

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai("gpt-4o"),
    system: TRPG_SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: trpgTools,
    stopWhen: stepCountIs(8),
  });

  return result.toUIMessageStreamResponse();
}
