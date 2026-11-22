"use client";

import { useSyncExternalStore } from "react";

const subscribeNever = () => () => {};

/**
 * Current year, resolved on the client. The server snapshot is empty because the page is
 * prerendered and a build-time year would go stale; hydration fills it in right away.
 */
export function CurrentYear() {
  const year = useSyncExternalStore(
    subscribeNever,
    () => String(new Date().getFullYear()),
    () => "",
  );
  return <span className="tabular-nums">{year}</span>;
}
