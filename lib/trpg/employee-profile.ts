export type EmployeeProfile = {
  name: string;
  age?: string;
  department: string;
  rank: string;
  employeeId: string;
  clearance?: string;
};

export type ChapterInfo = {
  title: string;
  subtitle?: string;
};

export const DEFAULT_PROFILE: EmployeeProfile = {
  name: "—",
  department: "미배정",
  rank: "말단",
  employeeId: "APMA-___",
};

export const EMPTY_PROFILE_LABEL = "입사 예정";

type MessagePart = {
  type: string;
  state?: string;
  output?: unknown;
};

function isProfile(output: unknown): output is EmployeeProfile {
  return (
    typeof output === "object" &&
    output !== null &&
    "name" in output &&
    "department" in output &&
    "employeeId" in output
  );
}

function isChapter(output: unknown): output is ChapterInfo {
  return typeof output === "object" && output !== null && "title" in output;
}

function isClearance(
  output: unknown,
): output is { level: string; reason: string } {
  return (
    typeof output === "object" && output !== null && "level" in output
  );
}

function isHorrorMode(output: unknown): output is { active: boolean } {
  return typeof output === "object" && output !== null && "active" in output;
}

function isGameDate(output: unknown): output is { date: string } {
  return typeof output === "object" && output !== null && "date" in output;
}

export function extractGameState(partsList: MessagePart[][]): {
  profile: EmployeeProfile;
  chapter: ChapterInfo | null;
  horrorMode: boolean;
  gameDate: string;
} {
  let profile: EmployeeProfile = { ...DEFAULT_PROFILE };
  let chapter: ChapterInfo | null = null;
  let horrorMode = false;
  let gameDate = "2026년 3월 1일";

  for (const parts of partsList) {
    for (const part of parts) {
      if (part.state !== "output-available" || !part.output) continue;

      if (part.type === "tool-updateEmployeeProfile" && isProfile(part.output)) {
        profile = {
          ...profile,
          name: part.output.name,
          age: part.output.age ?? profile.age,
          department: part.output.department,
          rank: part.output.rank,
          employeeId: part.output.employeeId,
        };
        const chapterTitle = (part.output as EmployeeProfile & { chapterTitle?: string }).chapterTitle;
        if (chapterTitle) {
          chapter = { title: chapterTitle };
        }
      }

      if (part.type === "tool-setChapter" && isChapter(part.output)) {
        chapter = part.output;
      }

      if (part.type === "tool-updateClearance" && isClearance(part.output)) {
        profile = { ...profile, clearance: part.output.level };
      }

      if (part.type === "tool-setHorrorMode" && isHorrorMode(part.output)) {
        horrorMode = part.output.active;
      }

      if (part.type === "tool-setGameDate" && isGameDate(part.output)) {
        gameDate = part.output.date;
      }
    }
  }

  return { profile, chapter, horrorMode, gameDate };
}
