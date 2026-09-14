import { DemoTour } from "@/components/studio/DemoTour";
import { RestoreNotice } from "@/components/studio/RestoreNotice";
import { StudioBar } from "@/components/studio/StudioBar";
import styles from "./studio.module.css";

export default function StudioLayout({ children }: LayoutProps<"/">) {
  return (
    <div className={styles.shell}>
      <StudioBar />
      <main id="main" className={styles.main}>
        <RestoreNotice />
        <DemoTour />
        {children}
      </main>
    </div>
  );
}
