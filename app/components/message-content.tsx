import type { DiceRollResult } from "@/lib/trpg/dice";
import { stripSuggestRepliesFromText } from "@/lib/trpg/suggest-replies-text";

import { FormattedText } from "./formatted-text";

type MessagePart = {
  type: string;
  text?: string;
  state?: string;
  input?: unknown;
  output?: unknown;
};

const HIDDEN_TOOLS = new Set([
  "tool-updateEmployeeProfile",
  "tool-setChapter",
  "tool-updateClearance",
  "tool-issueForm",
  "tool-stampApproval",
  "tool-suggestReplies",
]);

function isDiceOutput(output: unknown): output is DiceRollResult {
  return (
    typeof output === "object" &&
    output !== null &&
    "expression" in output &&
    "total" in output &&
    "rolls" in output
  );
}

function isFormOutput(
  output: unknown,
): output is { formType: string; target: string; summary: string; status?: string } {
  return (
    typeof output === "object" &&
    output !== null &&
    "formType" in output &&
    "summary" in output
  );
}

function isStampOutput(
  output: unknown,
): output is { formType: string; approver: string; decision: string; note?: string } {
  return (
    typeof output === "object" &&
    output !== null &&
    "decision" in output &&
    "approver" in output
  );
}

function DiceBlock({ result }: { result: DiceRollResult }) {
  return (
    <div className="dice-roll">
      <div className="dice-stamp">판정</div>
      <div className="dice-roll-header">
        <span className="dice-label">업무 판정서</span>
        <span className="dice-reason">{result.reason}</span>
      </div>
      <div className="dice-expression">{result.expression}</div>
      <div className="dice-detail">
        개별: [{result.rolls.join(", ")}]
        {result.modifier !== 0 && (
          <span>
            {" "}
            보정 {result.modifier > 0 ? "+" : ""}
            {result.modifier}
          </span>
        )}
      </div>
      <div className="dice-total">최종: {result.total}</div>
    </div>
  );
}

function FormBlock({
  form,
}: {
  form: { formType: string; target: string; summary: string; status?: string };
}) {
  return (
    <div className="form-card">
      <div className="form-card-header">
        <span className="form-card-label">내부 양식</span>
        {form.status && <span className="form-card-status">{form.status}</span>}
      </div>
      <p className="form-card-type">{form.formType}</p>
      <p className="form-card-summary">{form.summary}</p>
      <p className="form-card-target">대상: {form.target}</p>
    </div>
  );
}

function StampBlock({
  stamp,
}: {
  stamp: { formType: string; approver: string; decision: string; note?: string };
}) {
  return (
    <div className={`stamp-card stamp-${stamp.decision}`}>
      <span className="stamp-decision">{stamp.decision}</span>
      <span className="stamp-detail">
        {stamp.approver} · {stamp.formType}
      </span>
      {stamp.note && <span className="stamp-note">{stamp.note}</span>}
    </div>
  );
}

export function MessageContent({ parts }: { parts: MessagePart[] }) {
  return (
    <>
      {parts.map((part, index) => {
        if (HIDDEN_TOOLS.has(part.type)) {
          return null;
        }

        if (part.type === "text" && part.text) {
          const { cleanText } = stripSuggestRepliesFromText(part.text);
          if (!cleanText.trim()) return null;

          return <FormattedText key={`text-${index}`} text={cleanText} />;
        }

        if (
          part.type === "tool-rollDice" &&
          part.state === "output-available" &&
          isDiceOutput(part.output)
        ) {
          return <DiceBlock key={`dice-${index}`} result={part.output} />;
        }

        if (
          part.type === "tool-issueForm" &&
          part.state === "output-available" &&
          isFormOutput(part.output)
        ) {
          return <FormBlock key={`form-${index}`} form={part.output} />;
        }

        if (
          part.type === "tool-stampApproval" &&
          part.state === "output-available" &&
          isStampOutput(part.output)
        ) {
          return <StampBlock key={`stamp-${index}`} stamp={part.output} />;
        }

        return null;
      })}
    </>
  );
}
