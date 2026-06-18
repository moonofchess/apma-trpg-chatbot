import type { ReactNode } from "react";

const TOKEN_PATTERN =
  /("([^"]+)")|(\u201c([^\u201d]+)\u201d)|('([^']+)')|(\u2018([^\u2019]+)\u2019)|(\*([^*]+)\*)|([^"'\u201c\u201d\u2018\u2019*]+)/g;

type FormattedTextProps = {
  text: string;
  separateLines?: boolean;
};

type TextSegment = {
  kind: "dialogue" | "thought" | "emphasis" | "plain";
  text: string;
};

function parseInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let key = 0;

  for (const match of text.matchAll(TOKEN_PATTERN)) {
    const dialogue = match[2] ?? match[4];
    const thought = match[6] ?? match[8];
    const emphasis = match[10];
    const plain = match[11];

    if (dialogue) {
      nodes.push(
        <span key={key++} className="text-dialogue">
          &ldquo;{dialogue}&rdquo;
        </span>,
      );
    } else if (thought) {
      nodes.push(
        <span key={key++} className="text-thought">
          &lsquo;{thought}&rsquo;
        </span>,
      );
    } else if (emphasis) {
      nodes.push(
        <em key={key++} className="text-emphasis">
          {emphasis}
        </em>,
      );
    } else if (plain) {
      nodes.push(<span key={key++}>{plain}</span>);
    }
  }

  return nodes;
}

function splitSentences(text: string): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const matches = normalized.match(/[^.!?\u3002\uff01\uff1f]+[.!?\u3002\uff01\uff1f\u2026]*/g);
  return matches?.map((sentence) => sentence.trim()).filter(Boolean) ?? [normalized];
}

function splitIntoSegments(text: string): TextSegment[] {
  const segments: TextSegment[] = [];

  for (const line of text.split("\n")) {
    let foundToken = false;

    for (const match of line.matchAll(TOKEN_PATTERN)) {
      foundToken = true;
      const dialogue = match[2] ?? match[4];
      const thought = match[6] ?? match[8];
      const emphasis = match[10];
      const plain = match[11];

      if (dialogue) {
        segments.push({ kind: "dialogue", text: dialogue.trim() });
      } else if (thought) {
        segments.push({ kind: "thought", text: thought.trim() });
      } else if (emphasis) {
        segments.push({ kind: "emphasis", text: emphasis.trim() });
      } else if (plain) {
        for (const sentence of splitSentences(plain)) {
          segments.push({ kind: "plain", text: sentence });
        }
      }
    }

    if (!foundToken) {
      for (const sentence of splitSentences(line)) {
        segments.push({ kind: "plain", text: sentence });
      }
    }
  }

  return segments.filter((segment) => segment.text.length > 0);
}

function renderSegment(segment: TextSegment, key: number) {
  if (segment.kind === "dialogue") {
    return (
      <span key={key} className="message-line text-dialogue">
        &ldquo;{segment.text}&rdquo;
      </span>
    );
  }

  if (segment.kind === "thought") {
    return (
      <span key={key} className="message-line text-thought">
        &lsquo;{segment.text}&rsquo;
      </span>
    );
  }

  if (segment.kind === "emphasis") {
    return (
      <em key={key} className="message-line text-emphasis">
        {segment.text}
      </em>
    );
  }

  return (
    <span key={key} className="message-line">
      {segment.text}
    </span>
  );
}

export function FormattedText({ text, separateLines = false }: FormattedTextProps) {
  const paragraphs = text.split(/\n{2,}/);

  return (
    <>
      {paragraphs.map((paragraph, index) => {
        const trimmed = paragraph.trim();
        if (!trimmed) return null;

        if (separateLines) {
          const segments = splitIntoSegments(trimmed);
          if (segments.length === 0) return null;

          return (
            <div key={index} className="message-paragraph">
              {segments.map(renderSegment)}
            </div>
          );
        }

        const lines = trimmed.split("\n");

        return (
          <p key={index} className="message-paragraph">
            {lines.map((line, lineIndex) => (
              <span key={lineIndex}>
                {lineIndex > 0 && <br />}
                {parseInline(line)}
              </span>
            ))}
          </p>
        );
      })}
    </>
  );
}
