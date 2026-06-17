export type EmployeeProfile = {
  name: string;
  department: string;
  rank: string;
  employeeId: string;
};

export type ChapterInfo = {
  chapter: number;
  title: string;
  subtitle?: string;
};

export const DEFAULT_PROFILE: EmployeeProfile = {
  name: "—",
  department: "미배정",
  rank: "말단",
  employeeId: "APMA-2026-___",
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
  return (
    typeof output === "object" &&
    output !== null &&
    "chapter" in output &&
    "title" in output
  );
}

export function extractGameState(partsList: MessagePart[][]): {
  profile: EmployeeProfile;
  chapter: ChapterInfo | null;
} {
  let profile = { ...DEFAULT_PROFILE };
  let chapter: ChapterInfo | null = null;

  for (const parts of partsList) {
    for (const part of parts) {
      if (part.state !== "output-available" || !part.output) continue;

      if (part.type === "tool-updateEmployeeProfile" && isProfile(part.output)) {
        profile = {
          name: part.output.name,
          department: part.output.department,
          rank: part.output.rank,
          employeeId: part.output.employeeId,
        };
        const extended = part.output as EmployeeProfile & {
          chapter?: number;
          chapterTitle?: string;
        };
        if (extended.chapter && extended.chapterTitle) {
          chapter = {
            chapter: extended.chapter,
            title: extended.chapterTitle,
          };
        }
      }

      if (part.type === "tool-setChapter" && isChapter(part.output)) {
        chapter = part.output;
      }
    }
  }

  return { profile, chapter };
}
