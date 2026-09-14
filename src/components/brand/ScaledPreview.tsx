"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./ScaledPreview.module.css";

type Props = {
  /** Width the content is laid out at, in CSS pixels. Container queries inside see this width. */
  designWidth: number;
  designHeight: number;
  label: string;
  children: ReactNode;
};

/*
 * Shows a desktop-sized layout shrunk to fit its container, like a thumbnail
 * of a real page. The content is laid out at designWidth, so its container
 * queries behave as they would on a laptop, then scaled down as a picture.
 * It's decorative, so assistive tech gets the label instead of the contents.
 */
export function ScaledPreview({ designWidth, designHeight, label, children }: Props) {
  const outer = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  useEffect(() => {
    const el = outer.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / designWidth));
    observer.observe(el);
    return () => observer.disconnect();
  }, [designWidth]);

  return (
    <div
      ref={outer}
      className={styles.outer}
      style={{ aspectRatio: `${designWidth} / ${designHeight}` }}
      role="img"
      aria-label={label}
    >
      <div
        className={styles.inner}
        aria-hidden="true"
        inert
        style={{
          width: designWidth,
          height: designHeight,
          transform: `scale(${scale ?? 0})`,
          opacity: scale === null ? 0 : 1,
        }}
      >
        {children}
      </div>
    </div>
  );
}
