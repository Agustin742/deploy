/** Tiny markdown subset used by AI reports: headings, bullet and numbered lists, bold, italic. */

export interface InlineSpan {
  text: string;
  bold?: true;
  italic?: true;
}

export type ReportBlock =
  | { type: "heading"; inline: InlineSpan[] }
  | { type: "p"; inline: InlineSpan[] }
  | { type: "ul"; items: InlineSpan[][] }
  | { type: "ol"; items: InlineSpan[][] };

const BOLD = /\*\*(.+?)\*\*/g;
const ITALIC = /(^|[^*])\*([^*\s][^*]*)\*/g;

function italics(text: string, bold: boolean): InlineSpan[] {
  const out: InlineSpan[] = [];
  let last = 0;
  const push = (t: string, italic: boolean) => {
    if (!t) return;
    const span: InlineSpan = { text: t };
    if (bold) span.bold = true;
    if (italic) span.italic = true;
    out.push(span);
  };
  for (const m of text.matchAll(ITALIC)) {
    const start = (m.index ?? 0) + m[1].length;
    push(text.slice(last, start), false);
    push(m[2], true);
    last = start + m[2].length + 2;
  }
  push(text.slice(last), false);
  return out;
}

export function parseInline(text: string): InlineSpan[] {
  const out: InlineSpan[] = [];
  let last = 0;
  for (const m of text.matchAll(BOLD)) {
    const start = m.index ?? 0;
    out.push(...italics(text.slice(last, start), false), ...italics(m[1], true));
    last = start + m[0].length;
  }
  out.push(...italics(text.slice(last), false));
  return out;
}

export function parseReport(src: string): ReportBlock[] {
  const blocks: ReportBlock[] = [];
  let list: Extract<ReportBlock, { items: unknown }> | null = null;

  const addItem = (type: "ul" | "ol", text: string) => {
    const current: Extract<ReportBlock, { items: unknown }> = list?.type === type ? list : { type, items: [] };
    if (current !== list) blocks.push(current);
    list = current;
    current.items.push(parseInline(text));
  };

  for (const raw of src.split("\n")) {
    const line = raw.trim();
    let m: RegExpMatchArray | null;
    if (!line) list = null;
    else if ((m = line.match(/^#{1,4}\s+(.*)/))) {
      list = null;
      blocks.push({ type: "heading", inline: parseInline(m[1]) });
    } else if ((m = line.match(/^[-*•●]\s+(.*)/))) addItem("ul", m[1]);
    else if ((m = line.match(/^\d+[.)]\s+(.*)/))) addItem("ol", m[1]);
    else if (/^-{3,}$/.test(line)) list = null;
    else {
      list = null;
      blocks.push({ type: "p", inline: parseInline(line) });
    }
  }
  return blocks;
}
