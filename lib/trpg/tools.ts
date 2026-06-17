import { tool } from "ai";
import { z } from "zod";

import { rollDice } from "./dice";

export const trpgTools = {
  rollDice: tool({
    description: "판정용 주사위. 서버 난수.",
    inputSchema: z.object({
      count: z.number().int().min(1).max(20),
      sides: z.number().int().min(2).max(100),
      modifier: z.number().int().min(-20).max(20).default(0),
      reason: z.string(),
    }),
    execute: async ({ count, sides, modifier, reason }) =>
      rollDice(count, sides, modifier, reason),
  }),

  updateEmployeeProfile: tool({
    description: "사원증 정보 확정·변경 시.",
    inputSchema: z.object({
      name: z.string(),
      age: z.string().optional().describe("나이"),
      department: z.string(),
      rank: z.string(),
      employeeId: z.string(),
      chapterTitle: z.string().optional().describe("현재 근무일지 제목(사건명만)"),
    }),
    execute: async (profile) => profile,
  }),

  setChapter: tool({
    description: "서사 구간 전환. title은 사건명만(메타 번호 금지).",
    inputSchema: z.object({
      title: z.string().describe('예: "입사 D-Day", "첫 야근"'),
      subtitle: z.string().optional(),
    }),
    execute: async (chapter) => chapter,
  }),

  issueForm: tool({
    description: "양식 발급. 가결재 상태로 생성.",
    inputSchema: z.object({
      formType: z.string().describe("양식 종류"),
      target: z.string().describe("대상"),
      summary: z.string().describe("한 줄 요약"),
    }),
    execute: async (form) => ({ ...form, status: "가결재" as const }),
  }),

  stampApproval: tool({
    description: "결재 또는 반려. 괴이·규칙에 효력 발생.",
    inputSchema: z.object({
      formType: z.string(),
      approver: z.string(),
      decision: z.enum(["승인", "반려", "보류"]),
      note: z.string().optional(),
    }),
    execute: async (stamp) => stamp,
  }),

  updateClearance: tool({
    description: "플레이어 결재 권한 등급 변동.",
    inputSchema: z.object({
      level: z.string().describe("예: 가결재-only, 본결재-안전, 본결재-유클리드"),
      reason: z.string(),
    }),
    execute: async (clearance) => clearance,
  }),

  suggestReplies: tool({
    description:
      "매 턴 마지막에 필수 호출. 플레이어가 고를 답변 3개. 현재 장면·플레이어가 아는 정보만 반영. 본문에 목록으로 쓰지 말 것.",
    inputSchema: z.object({
      replies: z
        .array(z.string())
        .length(3)
        .describe("짧은 답변 문장 3개. 예: '신분증을 건넨다'"),
    }),
    execute: async ({ replies }) => ({ replies }),
  }),
};

export type TrpgTools = typeof trpgTools;
