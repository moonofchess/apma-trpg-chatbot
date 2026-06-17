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
  return typeof output === "object" && output !== null && "title" in output;
}

function isClearance(
  output: unknown,
): output is { level: string; reason: string } {
  return (
    typeof output === "object" && output !== null && "level" in output
  );
}

export function extractGameState(partsList: MessagePart[][]): {
  profile: EmployeeProfile;
  chapter: ChapterInfo | null;
} {
  let profile: EmployeeProfile = { ...DEFAULT_PROFILE };
  let chapter: ChapterInfo | null = null;

  for (const parts of partsList) {
    for (const part of parts) {
      if (part.state !== "output-available" || !part.output) continue;

      if (part.type === "tool-updateEmployeeProfile" && isProfile(part.output)) {
        profile = {
          ...profile,
          name: part.output.name,
          age: (part.output as EmployeeProfile).age ?? profile.age,
          department: part.output.department,
          rank: part.output.rank,
          employeeId: part.output.employeeId,
        };
        const extended = part.output as EmployeeProfile & {
          chapterTitle?: string;
        };
        if (extended.chapterTitle) {
          chapter = { title: extended.chapterTitle };
        }
      }

      if (part.type === "tool-setChapter" && isChapter(part.output)) {
        chapter = part.output;
      }

      if (part.type === "tool-updateClearance" && isClearance(part.output)) {
        profile = { ...profile, clearance: part.output.level };
      }
    }
  }

  return { profile, chapter };
}
