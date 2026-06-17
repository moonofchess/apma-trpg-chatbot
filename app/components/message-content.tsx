import type { DiceRollResult } from "@/lib/trpg/dice";

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

export function MessageContent({ parts }: { parts: MessagePart[] }) {
  return (
    <>
      {parts.map((part, index) => {
        if (HIDDEN_TOOLS.has(part.type)) {
          return null;
        }

        if (part.type === "text" && part.text) {
          return (
            <p key={`text-${index}`} className="message-paragraph">
              {part.text}
            </p>
          );
        }

        if (
          part.type === "tool-rollDice" &&
          part.state === "output-available" &&
          isDiceOutput(part.output)
        ) {
          return <DiceBlock key={`dice-${index}`} result={part.output} />;
        }

        return null;
      })}
    </>
  );
}
