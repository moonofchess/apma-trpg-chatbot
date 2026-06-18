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

function pickVariant(variants: string[][], seed: number): string[] {
  return variants[Math.abs(seed) % variants.length];
}

export function buildFallbackSuggestedReplies(
  chapter: ChapterInfo | null,
  seed = 0,
): string[] {
  const title = chapter?.title ?? "";

  if (title.includes("복사기") || title.includes("첫 출근") || title.includes("오리엔테이션")) {
    return pickVariant(
      [
        [
          "신분증을 꺼내 절차대로 제출한다",
          "박도윤 대리에게 복사기 상태를 조심스럽게 묻는다",
          "복도 쪽 이상한 소리에 귀를 기울인다",
        ],
        [
          "인사팀 직원에게 다음 서명 절차를 묻는다",
          "복사기 앞에서 멈춘 직원의 표정을 살핀다",
          "박도윤 대리에게 지금 물러서야 하는지 묻는다",
        ],
        [
          "사원증 발급 서류를 먼저 마무리한다",
          "타는 냄새가 나는 방향을 확인한다",
          "김세린 과장의 지시가 들릴 때까지 움직이지 않는다",
        ],
      ],
      seed,
    );
  }

  if (title.includes("야근") || title.includes("식대")) {
    return pickVariant(
      [
        [
          "영수증 내용을 다시 확인한다",
          "박도윤 대리에게 시간외근무 기안서를 묻는다",
          "사무실 문이 잠겼는지 확인한다",
        ],
        [
          "결제 수단 항목을 박도윤 대리에게 보여준다",
          "야근 신청서 양식을 내부망에서 찾는다",
          "복도 쪽 발소리가 가까워지는지 듣는다",
        ],
        [
          "배달 봉투에 남은 다른 영수증을 확인한다",
          "보호 결계에 필요한 결재자를 묻는다",
          "불이 꺼진 복도로 휴대폰 플래시를 비춘다",
        ],
      ],
      seed,
    );
  }

  if (title.includes("외근") || title.includes("현장")) {
    return pickVariant(
      [
        [
          "김세린 과장의 지시에 맞춰 장비를 확인한다",
          "현장 규칙을 한 번 더 물어본다",
          "폴리스 라인 너머의 침묵을 살핀다",
        ],
        [
          "출입 기록에 사번을 적는다",
          "박도윤 대리에게 뒤돌아보면 안 되는 이유를 묻는다",
          "무전기 채널이 맞는지 확인한다",
        ],
        [
          "방호복 밀폐 상태를 다시 점검한다",
          "김세린 과장의 손짓을 기다린다",
          "현장 바닥의 표식부터 확인한다",
        ],
      ],
      seed,
    );
  }

  if (title.includes("영수증") || title.includes("재구성")) {
    return pickVariant(
      [
        [
          "찢어진 방호복 사진을 증빙으로 첨부한다",
          "한지우 주임에게 반려 사유를 묻는다",
          "박도윤 대리와 사유서 문구를 다시 짠다",
        ],
        [
          "영수증 원본을 봉투에 넣어 제출한다",
          "총무부 규정집에서 예외 조항을 찾는다",
          "다음 경보 전에 임시 지급 요청서를 쓴다",
        ],
        [
          "장비 파손 경위를 시간순으로 정리한다",
          "한지우 주임에게 필요한 증빙 목록을 요구한다",
          "박도윤 대리에게 가장 그럴듯한 사유를 고르게 한다",
        ],
      ],
      seed,
    );
  }

  if (title.includes("7층") || title.includes("분실물")) {
    return pickVariant(
      [
        [
          "엘리베이터 버튼 표시를 확인한다",
          "박도윤 대리에게 방금 본 것을 말한다",
          "임시직이 건넨 사원증을 받아 든다",
        ],
        [
          "열린 문 너머 복도 번호를 확인한다",
          "박도윤 대리의 사원증과 날짜를 비교한다",
          "임시직에게 이 층의 부서를 묻는다",
        ],
        [
          "엘리베이터 닫힘 버튼을 눌러 본다",
          "복도 벽에 붙은 안내문을 읽는다",
          "낡은 사원증 뒷면을 확인한다",
        ],
      ],
      seed,
    );
  }

  return pickVariant(
    [
      [
        "절차대로 필요한 서류를 확인한다",
        "눈앞의 이상한 점을 NPC에게 묻는다",
        "다음 결재 단계로 움직인다",
      ],
      [
        "현재 양식의 결재칸을 확인한다",
        "가장 가까운 직원에게 상황을 묻는다",
        "내부망 알림을 열어 다음 지시를 확인한다",
      ],
      [
        "사번과 부서명이 제대로 찍혔는지 확인한다",
        "박도윤 대리에게 지금 할 일을 묻는다",
        "경보음이 난 방향으로 조심스럽게 시선을 돌린다",
      ],
    ],
    seed,
  );
}
