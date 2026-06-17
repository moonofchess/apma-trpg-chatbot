import { tool } from "ai";
import { z } from "zod";

import { rollDice } from "./dice";

export const trpgTools = {
  rollDice: tool({
    description:
      "업무·현장 판정용 주사위를 굴립니다. 보고서 작성, 상사 설득, 괴이 관찰, 현장 대응, 스트레스 내성, 몰래 열람 등 판정 시 반드시 호출하세요. 결과는 서버 난수입니다.",
    inputSchema: z.object({
      count: z
        .number()
        .int()
        .min(1)
        .max(20)
        .describe("굴릴 주사위 개수 (예: 1)"),
      sides: z
        .number()
        .int()
        .min(2)
        .max(100)
        .describe("주사위 면 수 (예: 20이면 d20)"),
      modifier: z
        .number()
        .int()
        .min(-20)
        .max(20)
        .default(0)
        .describe("능력치·상황 보정치"),
      reason: z
        .string()
        .describe(
          "판정 항목 (예: '보고서 품질', '김 과장 설득', '괴이 관찰', '야근 스트레스')",
        ),
    }),
    execute: async ({ count, sides, modifier, reason }) =>
      rollDice(count, sides, modifier, reason),
  }),
};

export type TrpgTools = typeof trpgTools;
