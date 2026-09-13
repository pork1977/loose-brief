import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Wordmark } from "@/components/ui/Wordmark";
import styles from "./SiteHeader.module.css";

export function SiteHeader() {
  return (
    <header className={styles.header} style={{ viewTransitionName: "site-header" }}>
      <div className={`ui-container ${styles.inner}`}>
        <Wordmark />
        <nav className={styles.nav} aria-label="Main">
          <Link href="/#how-it-works">How it works</Link>
          <Link href="/how-its-built" transitionTypes={["page-fade"]}>
            How it&rsquo;s built
          </Link>
        </nav>
        <div className={styles.actions}>
          <ThemeToggle />
          <ButtonLink href="/brief" variant="primary" size="small" transitionTypes={["nav-forward"]}>
            Start a project
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
