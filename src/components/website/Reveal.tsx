"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { useWebsiteFrame } from "./WebsiteContext";
import styles from "./Website.module.css";

/*
 * Fades a block up as it scrolls into the frame. Anything already in view on
 * first check shows straight away, so nothing flashes, and it does nothing at
 * all in thumbnails or for people who've asked for reduced motion.
 */
export function Reveal({ as: Tag = "div", className, children, delay = 0 }: { as?: ElementType; className?: string; children: ReactNode; delay?: number }) {
  const { interactive, scrollRoot } = useWebsiteFrame();
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<"shown" | "waiting">("shown");

  useEffect(() => {
    const el = ref.current;
    if (!interactive || !scrollRoot || !el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let first = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("shown");
          observer.disconnect();
        } else if (first) {
          setState("waiting");
        }
        first = false;
      },
      { root: scrollRoot, threshold: 0.12 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [interactive, scrollRoot]);

  return (
    <Tag ref={ref} className={[styles.reveal, className].filter(Boolean).join(" ")} data-reveal={state} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}
