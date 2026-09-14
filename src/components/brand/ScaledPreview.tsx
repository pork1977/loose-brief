"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./ScaledPreview.module.css";

type Props = {
  /** Width the content is laid out at, in CSS pixels. Container queries inside see this width. */
  designWidth: number;
  /** Fixed height to crop to. Leave out to show the content's full height, scaled. */
  designHeight?: number;
  label: string;
  /** Hands back the element the content is rendered into, e.g. for highlighting parts of it. */
  onContentElement?: (element: HTMLDivElement | null) => void;
  children: ReactNode;
};

/*
 * Shows a desktop-sized layout shrunk to fit its container, like a thumbnail
 * of a real page. The content is laid out at designWidth, so its container
 * queries behave as they would on a laptop, then scaled down as a picture.
 * It's decorative, so assistive tech gets the label instead of the contents.
 */
export function ScaledPreview({ designWidth, designHeight, label, onContentElement, children }: Props) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState<number | null>(null);
  const [contentHeight, setContentHeight] = useState<number | null>(null);

  useEffect(() => {
    const el = outer.current;
    const content = inner.current;
    if (!el || !content) return;
    const measure = () => {
      const width = el.getBoundingClientRect().width;
      if (width > 0) setScale(width / designWidth);
      if (designHeight === undefined) setContentHeight(content.scrollHeight);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    observer.observe(content);
    // ResizeObserver stays quiet in background tabs; measure once regardless.
    const timer = window.setTimeout(measure, 0);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [designWidth, designHeight]);

  const height = designHeight ?? contentHeight ?? 0;

  return (
    <div
      ref={outer}
      className={styles.outer}
      style={
        designHeight !== undefined
          ? { aspectRatio: `${designWidth} / ${designHeight}` }
          : { height: scale !== null ? height * scale : undefined }
      }
      role="img"
      aria-label={label}
    >
      <div
        ref={(node) => {
          inner.current = node;
          onContentElement?.(node);
        }}
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
