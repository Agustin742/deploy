import { Fragment } from "react";
import { parseReport, type InlineSpan } from "../domain/report-markdown";

function Inline({ spans }: { spans: InlineSpan[] }) {
  return (
    <>
      {spans.map((s, i) => {
        let node = <Fragment key={i}>{s.text}</Fragment>;
        if (s.italic) node = <i key={i}>{s.text}</i>;
        if (s.bold) node = <b key={i}>{s.italic ? <i>{s.text}</i> : s.text}</b>;
        return node;
      })}
    </>
  );
}

/** Renders a stored report (markdown subset) as safe React elements. */
export function ReportView({ source }: { source: string }) {
  return (
    <div className="leading-relaxed">
      {parseReport(source).map((b, i) => {
        if (b.type === "heading") {
          return (
            <h3 key={i} className="mb-1 mt-3.5 text-base font-bold">
              <Inline spans={b.inline} />
            </h3>
          );
        }
        if (b.type === "p") {
          return (
            <p key={i} className="my-1.5">
              <Inline spans={b.inline} />
            </p>
          );
        }
        const List = b.type;
        return (
          <List key={i} className={`mb-2 mt-1 pl-5 ${b.type === "ul" ? "list-disc" : "list-decimal"}`}>
            {b.items.map((item, j) => (
              <li key={j}>
                <Inline spans={item} />
              </li>
            ))}
          </List>
        );
      })}
    </div>
  );
}
