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
const DEFAULT_MODEL = "gpt-5.4-mini";

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
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
      system: TRPG_SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      tools: trpgTools,
      providerOptions: {
        openai: {
          reasoningEffort: "high",
          textVerbosity: "high",
        },
      },
      stopWhen: stepCountIs(8),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error", error);
    return jsonError("Failed to start chat response.", 500);
  }
}
