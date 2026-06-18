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

type MessageContentProps = {
  parts: MessagePart[];
  role?: string;
  onRollDice?: (toolCallId: string, input: DiceRollInput) => void;
  diceDisabled?: boolean;
};

export type DiceRollInput = {
  count: number;
  sides: number;
  modifier?: number;
  reason: string;
};

const HIDDEN_TOOLS = new Set([
  "tool-updateEmployeeProfile",
  "tool-setChapter",
  "tool-updateClearance",
  "tool-setHorrorMode",
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

function isDiceInput(input: unknown): input is DiceRollInput {
  return (
    typeof input === "object" &&
    input !== null &&
    "count" in input &&
    "sides" in input &&
    "reason" in input
  );
}

function describeDiceExpression(expression: string) {
  const match = expression.match(/^(\d+)d(\d+)([+-]\d+)?$/);
  if (!match) return expression;

  const [, countText, sidesText] = match;
  const count = Number(countText);
  const sides = Number(sidesText);
  const countLabel = count === 1 ? "한 번" : `${count}번`;

  return `1부터 ${sides}까지의 값 중 하나를 ${countLabel} 뽑습니다. 높을수록 유리합니다.`;
}

function formatRolls(rolls: number[]) {
  if (rolls.length === 1) return `${rolls[0]}점`;
  return rolls.map((roll, index) => `${index + 1}번째 ${roll}점`).join(", ");
}

function DiceBlock({ result }: { result: DiceRollResult }) {
  return (
    <div className="dice-roll">
      <div className="dice-stamp">판정</div>
      <div className="dice-roll-header">
        <span className="dice-label">업무 판정 결과</span>
        <span className="dice-reason">{result.reason}</span>
      </div>
      <div className="dice-expression">
        {describeDiceExpression(result.expression)}
      </div>
      <div className="dice-detail">
        나온 값: {formatRolls(result.rolls)}
        {result.modifier !== 0 && (
          <span>
            {" "}
            보정 {result.modifier > 0 ? "+" : ""}
            {result.modifier}
          </span>
        )}
      </div>
      <div className="dice-total">판정값: {result.total}점</div>
    </div>
  );
}

function PendingDiceBlock({
  input,
  toolCallId,
  onRollDice,
  disabled,
}: {
  input: DiceRollInput;
  toolCallId?: string;
  onRollDice?: (toolCallId: string, input: DiceRollInput) => void;
  disabled?: boolean;
}) {
  return (
    <div className="dice-roll dice-roll-pending">
      <div className="dice-stamp">대기</div>
      <div className="dice-roll-header">
        <span className="dice-label">업무 판정</span>
        <span className="dice-reason">{input.reason}</span>
      </div>
      <div className="dice-prompt">
        <span className="dice-image" aria-hidden="true">
          <span className="dice-pip dice-pip-1" />
          <span className="dice-pip dice-pip-2" />
          <span className="dice-pip dice-pip-3" />
          <span className="dice-pip dice-pip-4" />
          <span className="dice-pip dice-pip-5" />
          <span className="dice-pip dice-pip-6" />
        </span>
        <div>
          <p className="dice-prompt-title">판정이 들어갑니다.</p>
          <p className="dice-expression">{describeDiceExpression(`${input.count}d${input.sides}`)}</p>
        </div>
      </div>
      <button
        type="button"
        className="dice-roll-button"
        disabled={disabled || !toolCallId || !onRollDice}
        onClick={() => toolCallId && onRollDice?.(toolCallId, input)}
      >
        주사위 던지기
      </button>
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

export function MessageContent({
  parts,
  role,
  onRollDice,
  diceDisabled,
}: MessageContentProps) {
  return (
    <>
      {parts.map((part, index) => {
        if (HIDDEN_TOOLS.has(part.type)) {
          return null;
        }

        if (part.type === "text" && part.text) {
          const { cleanText } = stripSuggestRepliesFromText(part.text);
          if (!cleanText.trim()) return null;

          return (
            <FormattedText
              key={`text-${index}`}
              text={cleanText}
              separateLines={role === "assistant"}
            />
          );
        }

        if (
          part.type === "tool-rollDice" &&
          part.state === "input-available" &&
          isDiceInput(part.input)
        ) {
          return (
            <PendingDiceBlock
              key={`dice-${index}`}
              input={part.input}
              toolCallId={"toolCallId" in part ? String(part.toolCallId) : undefined}
              onRollDice={onRollDice}
              disabled={diceDisabled}
            />
          );
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
