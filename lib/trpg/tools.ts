import { tool } from "ai";
import { z } from "zod";

import { rollDice } from "./dice";

export const trpgTools = {
  rollDice: tool({
    description:
      "업무·현장 판정용 주사위. 보고서, 설득, 관찰, 대응, 스트레스 등. 반드시 서버 난수 사용.",
    inputSchema: z.object({
      count: z.number().int().min(1).max(20).describe("주사위 개수"),
      sides: z.number().int().min(2).max(100).describe("면 수 (d20이면 20)"),
      modifier: z
        .number()
        .int()
        .min(-20)
        .max(20)
        .default(0)
        .describe("보정치"),
      reason: z.string().describe("판정 항목"),
    }),
    execute: async ({ count, sides, modifier, reason }) =>
      rollDice(count, sides, modifier, reason),
  }),

  updateEmployeeProfile: tool({
    description:
      "플레이어 사원증 정보 확정·변경 시 호출. 캐릭터 생성 완료, 부서 배치, 승진·이동 시 필수.",
    inputSchema: z.object({
      name: z.string().describe("플레이어 이름"),
      department: z.string().describe("소속 부서"),
      rank: z.string().describe("직급 (예: 주임, 대리, 7급)"),
      employeeId: z.string().describe("사번 (예: APMA-2026-0147)"),
      chapter: z.number().int().optional().describe("현재 챕터 번호"),
      chapterTitle: z.string().optional().describe("현재 챕터 제목"),
    }),
    execute: async (profile) => profile,
  }),

  setChapter: tool({
    description: "새 챕터(화) 시작 시 호출. 챕터 번호와 제목을 UI에 반영.",
    inputSchema: z.object({
      chapter: z.number().int().min(1).describe("챕터 번호"),
      title: z.string().describe("챕터 제목 (예: 제1화 · 입사 D-Day)"),
      subtitle: z.string().optional().describe("부제"),
    }),
    execute: async (chapter) => chapter,
  }),
};

export type TrpgTools = typeof trpgTools;
