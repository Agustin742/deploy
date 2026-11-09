import type { Command } from "./commands";

/**
 * Identity of the row a debounced edit belongs to. Edits with the same key are merged into one
 * command before it is sent; a command without a key cannot be merged and is sent right away.
 */
export function coalesceKey(command: Command): string | null {
  switch (command.type) {
    case "profile.setFields":
    case "base.setFields":
    case "brand.setFields":
    case "draft.setFields":
    case "goal.set":
      return command.type;
    case "app.setFields":
      return `${command.type}:${command.id}`;
    case "interview.setFields":
      return `${command.type}:${command.appId}:${command.id}`;
    case "registry.setFields":
      return `${command.type}:${command.kind}:${command.id}`;
    case "checklist.set":
      return `${command.type}:${command.appId}:${command.key}`;
    case "plan.setTarget":
      return `${command.type}:${command.key}`;
    case "module.set":
      return `${command.type}:${command.mod}`;
    default:
      return null;
  }
}

type Loose = Record<string, unknown>;

const mergeObjects = (a: unknown, b: unknown): Loose | undefined =>
  a === undefined && b === undefined ? undefined : { ...(a as Loose | undefined), ...(b as Loose | undefined) };

/** Merges two commands with the same key: field patches are combined, later values win. */
export function mergeCommands(earlier: Command, later: Command): Command {
  const a = earlier as unknown as Loose;
  const b = later as unknown as Loose;
  const merged: Loose = { ...a, ...b };
  for (const part of ["fields", "ficha"]) {
    const value = mergeObjects(a[part], b[part]);
    if (value !== undefined) merged[part] = value;
  }
  if (a.type === "checklist.set") {
    // `ok` and `txt` are independent parts of the same row: keep whichever side set them.
    if (b.ok === undefined && a.ok !== undefined) merged.ok = a.ok;
    if (b.txt === undefined && a.txt !== undefined) merged.txt = a.txt;
  }
  if (b.match === undefined && a.match !== undefined) merged.match = a.match;
  return merged as unknown as Command;
}
