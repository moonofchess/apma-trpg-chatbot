import type { ReactNode } from "react";

const TOKEN_PATTERN =
  /("([^"]+)")|('([^']+)')|(\*([^*]+)\*)|([^"'*]+)/g;

function parseInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let key = 0;

  for (const match of text.matchAll(TOKEN_PATTERN)) {
    const [
      ,
      ,
      dialogue,
      ,
      thought,
      ,
      emphasis,
      plain,
    ] = match;

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

export function FormattedText({ text }: { text: string }) {
  const paragraphs = text.split(/\n{2,}/);

  return (
    <>
      {paragraphs.map((paragraph, index) => {
        const trimmed = paragraph.trim();
        if (!trimmed) return null;

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
