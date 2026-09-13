import Link from "next/link";
import styles from "./Wordmark.module.css";

/** A loose outline square settling behind a solid one: a rough brief, made precise. */
export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg className={styles.mark} width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect
        className={styles.loose}
        x="5"
        y="5"
        width="18"
        height="18"
        rx="2"
        strokeWidth="2.4"
      />
      <rect className={styles.set} x="11" y="11" width="17" height="17" rx="2" />
    </svg>
  );
}

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className={styles.wordmark} transitionTypes={["page-fade"]}>
      <LogoMark />
      <span>Loose Brief</span>
    </Link>
  );
}
