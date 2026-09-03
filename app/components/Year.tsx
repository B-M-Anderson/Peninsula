"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const read = () => new Date().getFullYear();

/** The current year, computed in the visitor's browser rather than baked in at build. */
export default function Year() {
  const year = useSyncExternalStore(subscribe, read, read);
  return <span suppressHydrationWarning>{year}</span>;
}
