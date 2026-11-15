import { Fragment, type ReactNode } from "react";

// Shows the owner's page text with simple formatting — no HTML is ever
// inserted, so nothing typed into a page can break the shop:
//   "## Heading", "### Smaller heading", "- bullet point", **bold**,
//   an empty line starts a new paragraph, and web/email links become clickable.
export function RichText({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n\s*\n/);
  return (
    <div className="flex flex-col gap-4 leading-relaxed">
      {blocks.map((block, index) => (
        <Block key={index} lines={block.split("\n").filter((line) => line.trim())} />
      ))}
    </div>
  );
}

function Block({ lines }: { lines: string[] }) {
  if (!lines.length) return null;
  const out: ReactNode[] = [];
  let bullets: string[] = [];
  let paragraph: string[] = [];
  const flush = () => {
    if (bullets.length) {
      out.push(
        <ul key={`ul${out.length}`} className="ml-5 list-disc space-y-1.5">
          {bullets.map((item, i) => (
            <li key={i}>{inline(item)}</li>
          ))}
        </ul>,
      );
      bullets = [];
    }
    if (paragraph.length) {
      out.push(
        <p key={`p${out.length}`}>
          {paragraph.map((line, i) => (
            <Fragment key={i}>
              {i > 0 && <br />}
              {inline(line)}
            </Fragment>
          ))}
        </p>,
      );
      paragraph = [];
    }
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith("### ")) {
      flush();
      out.push(<h3 key={`h${out.length}`} className="text-xl">{inline(line.slice(4))}</h3>);
    } else if (line.startsWith("## ")) {
      flush();
      out.push(<h2 key={`h${out.length}`} className="mt-2 text-2xl">{inline(line.slice(3))}</h2>);
    } else if (/^[-*•] /.test(line)) {
      if (paragraph.length) flush();
      bullets.push(line.slice(2));
    } else {
      if (bullets.length) flush();
      paragraph.push(line);
    }
  }
  flush();
  return <>{out}</>;
}

const TOKEN = /(\*\*[^*]+\*\*|https?:\/\/[^\s)]+|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;

function inline(text: string): ReactNode[] {
  return text.split(TOKEN).map((part, i) => {
    if (!part) return null;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (/^https?:\/\//.test(part)) {
      const url = part.replace(/[.,;:!?]+$/, "");
      return (
        <Fragment key={i}>
          <a href={url} className="font-bold text-sky-dark underline underline-offset-2" rel="noopener">
            {url}
          </a>
          {part.slice(url.length)}
        </Fragment>
      );
    }
    if (part.includes("@")) {
      const email = part.replace(/[.,;:!?]+$/, "");
      return (
        <Fragment key={i}>
          <a href={`mailto:${email}`} className="font-bold text-sky-dark underline underline-offset-2">
            {email}
          </a>
          {part.slice(email.length)}
        </Fragment>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}
