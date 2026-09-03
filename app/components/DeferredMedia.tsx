"use client";

import type { CSSProperties, ReactNode } from "react";
import { useRowOpened } from "./Accordion";

/**
 * Media inside a disclosure row: nothing downloads until the row has been
 * opened once. The box is reserved from `aspect` so the open transition has a
 * stable height and nothing jumps when the image arrives.
 */
export default function DeferredMedia({ aspect, children, style }: { aspect: number; children: ReactNode; style?: CSSProperties }) {
  const opened = useRowOpened();
  return (
    <div style={{ aspectRatio: String(aspect), ...style }}>
      {opened ? children : null}
    </div>
  );
}
