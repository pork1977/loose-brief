import type { Metadata, Viewport } from "next";
import { fontVariables } from "@/lib/fonts";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import "./globals.css";
import "./forms.css";

export const metadata: Metadata = {
  title: {
    default: "Loose Brief",
    template: "%s | Loose Brief",
  },
  description:
    "Turn a short business brief into three brand directions, a design token system and a working website.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f1ea" },
    { media: "(prefers-color-scheme: dark)", color: "#12110f" },
  ],
};

/*
 * Runs before first paint so the page never flashes the wrong theme. It only
 * sets data-theme when the visitor has picked one; otherwise the CSS follows
 * the operating system setting.
 */
const themeScript = `try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
