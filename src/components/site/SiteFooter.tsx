import Link from "next/link";
import { LogoMark } from "@/components/ui/Wordmark";
import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`ui-container ${styles.inner}`}>
        <p className={styles.credit}>
          <LogoMark size={18} />
          <span>
            Loose Brief is a portfolio project by{" "}
            <a href="https://pwilson.dev" rel="author">
              Paul Wilson
            </a>
            .
          </span>
        </p>
        <nav className={styles.links} aria-label="Footer">
          <Link href="/how-its-built" transitionTypes={["page-fade"]}>
            How it&rsquo;s built
          </Link>
          <Link href="/brief" transitionTypes={["nav-forward"]}>
            Start a project
          </Link>
        </nav>
      </div>
    </footer>
  );
}
