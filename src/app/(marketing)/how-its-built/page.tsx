import type { Metadata } from "next";
import { PageTransition } from "@/components/PageTransition";
import styles from "../landing.module.css";

export const metadata: Metadata = {
  title: "How it's built",
};

export default function HowItsBuiltPage() {
  return (
    <PageTransition>
      <section className={styles.section} style={{ borderTop: 0 }}>
        <div className="ui-container">
          <header className={styles.sectionHeader}>
            <p className="ui-eyebrow">How it&rsquo;s built</p>
            <h1 className={styles.sectionTitle}>Not written yet</h1>
            <p className={styles.sectionLead}>
              This page will explain the token model, how the website preview works and where AI is and isn&rsquo;t
              used. It gets written once those parts exist.
            </p>
          </header>
        </div>
      </section>
    </PageTransition>
  );
}
