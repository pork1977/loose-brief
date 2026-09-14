"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { BrandScope } from "@/components/brand/BrandScope";
import { ScaledPreview } from "@/components/brand/ScaledPreview";
import { ButtonLink } from "@/components/ui/Button";
import { Website } from "@/components/website/Website";
import { isDemoBrief } from "@/data/demo-brief";
import { everythingZip, exportFileName, siteFiles, siteZip, textExports } from "@/lib/export/bundle";
import { SOCIAL_FORMATS, canvasToPng, drawSocialCard, type SocialFormat } from "@/lib/export/social";
import { useProject } from "@/state/project-store";
import styles from "./ExportWorkspace.module.css";

type Download = { name: string; data: Uint8Array | string; type: string };

function download({ name, data, type }: Download) {
  const blob = new Blob([typeof data === "string" ? data : new Uint8Array(data)], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function openInTab(html: string) {
  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  window.open(url, "_blank", "noopener");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function ExportWorkspace() {
  const project = useProject();
  if (!project?.state.brand) {
    return (
      <p className="visually-hidden" role="status">
        Loading your exports
      </p>
    );
  }
  return <Workspace />;
}

function Workspace() {
  const project = useProject();
  const brand = project?.state.brand;
  const brief = project?.state.brief;
  const brandName = brief?.name.trim() ?? "";
  const direction = brand?.direction;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvases = useRef<Partial<Record<SocialFormat, HTMLCanvasElement | null>>>({});

  const input = useMemo(() => (direction && brief ? { brandName, direction, brief } : null), [brandName, direction, brief]);
  const text = useMemo(() => (input ? textExports(input) : null), [input]);
  const site = useMemo(() => (input ? siteFiles(input) : null), [input]);

  if (!project || !brand || !brief || !direction || !input || !text || !site) return null;

  const file = (suffix: string) => exportFileName(brandName, suffix);
  const demo = isDemoBrief(brief);

  // A single file that works when opened straight from a download or a new tab.
  const standaloneSite = () =>
    site["index.html"]
      .replace('<link rel="stylesheet" href="styles.css" />', `<style>\n${site["styles.css"]}\n</style>`)
      .replace('<script src="site.js" defer></script>', "")
      .replace("</body>", `<script>\n${site["site.js"]}\n</script>\n</body>`);

  const downloadEverything = async () => {
    setBusy(true);
    setError(null);
    try {
      const images: Record<string, Uint8Array> = {};
      for (const format of Object.keys(SOCIAL_FORMATS) as SocialFormat[]) {
        const canvas = canvases.current[format];
        if (canvas) images[SOCIAL_FORMATS[format].file] = await canvasToPng(canvas);
      }
      download({ name: file("brand-kit.zip"), data: everythingZip(input, images), type: "application/zip" });
    } catch {
      setError("The zip couldn't be made. Try again, or download the files one at a time below.");
    } finally {
      setBusy(false);
    }
  };

  const downloadSite = () => {
    try {
      setError(null);
      download({ name: file("website.zip"), data: siteZip(input), type: "application/zip" });
    } catch {
      setError("The website zip couldn't be made. Try again, or refresh the page.");
    }
  };

  return (
    <div className={styles.workspace}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <p className="ui-eyebrow">Stage 05 / Export</p>
          <h1 className={styles.title}>Take {brandName} with you</h1>
          <p className={styles.intro}>
            Everything is built from the brand as it is now, so the website, tokens and documents all match. Nothing is uploaded; files are made in your browser.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className="ui-button ui-button--primary" onClick={downloadEverything} disabled={busy}>
            {busy ? "Preparing…" : "Download everything (.zip)"}
          </button>
        </div>
      </header>

      {error ? (
        <div className="ui-notice ui-notice--error" role="alert">
          <p>{error}</p>
          <button type="button" className="ui-button ui-button--ghost ui-button--small" onClick={() => setError(null)}>
            OK
          </button>
        </div>
      ) : null}

      {demo ? (
        <p className="ui-notice" role="note">
          Ebbfield is a made-up company, so its figures, partners and quote are illustrative. If you use this as a starting point, replace them with real ones before publishing.
        </p>
      ) : null}

      <div className={styles.grid}>
        <article className={`${styles.card} ${styles.featured}`} aria-labelledby="export-site">
          <BrandScope tokens={direction.tokens} className={styles.sitePreview}>
            <ScaledPreview designWidth={1280} designHeight={820} label={`${brandName} homepage`}>
              <Website brandName={brandName} direction={direction} />
            </ScaledPreview>
          </BrandScope>
          <div className={styles.cardBody}>
            <p className={styles.kind}>Website</p>
            <h2 id="export-site" className={styles.cardTitle}>
              The homepage, ready to put online
            </h2>
            <p className={styles.description}>
              A static site: <code>index.html</code>, <code>styles.css</code> with your tokens at the top, and a small <code>site.js</code> for the menu, form and interactive parts. It
              opens in any browser, and the whole folder can go on any web host. It&rsquo;s the same page the Studio shows.
            </p>
            <div className={styles.actions}>
              <button type="button" className="ui-button ui-button--primary ui-button--small" onClick={downloadSite}>
                Download website (.zip)
              </button>
              <button type="button" className="ui-button ui-button--small" onClick={() => openInTab(standaloneSite())}>
                Open in a new tab
              </button>
              <ButtonLink href="/studio" variant="ghost" size="small" transitionTypes={["nav-back"]}>
                Back to the Studio
              </ButtonLink>
            </div>
            <CodeViewer files={{ "index.html": site["index.html"], "styles.css": site["styles.css"], "site.js": site["site.js"], "README.txt": site["README.txt"] }} />
          </div>
        </article>

        <FileCard
          kind="Document"
          title="Brand guidelines"
          description="A page covering strategy, voice, colour with contrast results, type, spacing, components, imagery and motion. Use your browser's Print option to save it as a PDF."
          files={{ "brand-guidelines.html": text["brand-guidelines.html"] }}
          actions={
            <>
              <button type="button" className="ui-button ui-button--small" onClick={() => openInTab(text["brand-guidelines.html"])}>
                Open
              </button>
              <DownloadButton name={file("brand-guidelines.html")} data={text["brand-guidelines.html"]} type="text/html" />
            </>
          }
          viewable={false}
        />

        <FileCard
          kind="For developers and AI tools"
          title="DESIGN.md"
          description="The design system written out in plain Markdown: every token with what it's for, usage rules, contrast results and notes for AI coding tools."
          files={{ "DESIGN.md": text["DESIGN.md"] }}
          actions={<DownloadButton name={file("DESIGN.md")} data={text["DESIGN.md"]} type="text/markdown" copy />}
        />

        <FileCard
          kind="Tokens"
          title="CSS variables"
          description="Every token as a CSS custom property, with both colour sets. Drop it into any project."
          files={{ "tokens.css": text["tokens.css"] }}
          actions={<DownloadButton name={file("tokens.css")} data={text["tokens.css"]} type="text/css" copy />}
        />

        <FileCard
          kind="Tokens"
          title="Design tokens JSON"
          description="The W3C Design Tokens format, which Figma plugins and token tools such as Style Dictionary can read."
          files={{ "tokens.json": text["tokens.json"] }}
          actions={<DownloadButton name={file("tokens.json")} data={text["tokens.json"]} type="application/json" copy />}
        />

        <FileCard
          kind="Tokens"
          title="Tailwind theme"
          description="A Tailwind CSS v4 theme, giving utilities like bg-brand-primary, font-display, rounded-card and shadow-card."
          files={{ "tailwind-theme.css": text["tailwind-theme.css"] }}
          actions={<DownloadButton name={file("tailwind-theme.css")} data={text["tailwind-theme.css"]} type="text/css" copy />}
        />

        <FileCard
          kind="Copy"
          title="Copy deck"
          description="Every word on the homepage in page order, with the tone of voice, for editing or handing to a writer."
          files={{ "copy-deck.md": text["copy-deck.md"] }}
          actions={<DownloadButton name={file("copy-deck.md")} data={text["copy-deck.md"]} type="text/markdown" copy />}
        />

        <FileCard
          kind="Data"
          title="Site content"
          description="The homepage content and brand strategy as structured JSON, for loading into another tool or a CMS."
          files={{ "site-content.json": text["site-content.json"] }}
          actions={<DownloadButton name={file("site-content.json")} data={text["site-content.json"]} type="application/json" copy />}
        />

        <article className={`${styles.card} ${styles.featured}`} aria-labelledby="export-social">
          <div className={styles.cardBody}>
            <p className={styles.kind}>Social</p>
            <h2 id="export-social" className={styles.cardTitle}>
              Social cards
            </h2>
            <p className={styles.description}>A link preview card and a square post, drawn in your fonts and colours with the hero headline.</p>
            <div className={styles.social}>
              {(Object.keys(SOCIAL_FORMATS) as SocialFormat[]).map((format) => (
                <SocialCard
                  key={format}
                  format={format}
                  onCanvas={(canvas) => {
                    canvases.current[format] = canvas;
                  }}
                  render={(canvas) => drawSocialCard(canvas, direction, brandName, brand.previewMode, format)}
                  dependency={`${JSON.stringify(direction.tokens)}|${direction.sample.headline}|${direction.sample.eyebrow}|${direction.sample.primaryCta}|${brandName}|${brand.previewMode}`}
                  fileName={file(SOCIAL_FORMATS[format].file)}
                />
              ))}
            </div>
          </div>
        </article>
      </div>

      <nav className={styles.pager} aria-label="Stage navigation">
        <ButtonLink href="/studio" variant="ghost" transitionTypes={["nav-back"]}>
          <span aria-hidden="true">&larr;</span> Studio
        </ButtonLink>
      </nav>
    </div>
  );
}

function DownloadButton({ name, data, type, copy = false }: { name: string; data: string; type: string; copy?: boolean }) {
  const [copied, setCopied] = useState<"idle" | "copied" | "failed">("idle");
  return (
    <>
      <button type="button" className="ui-button ui-button--small" onClick={() => download({ name, data, type })}>
        Download
      </button>
      {copy ? (
        <button
          type="button"
          className="ui-button ui-button--ghost ui-button--small"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(data);
              setCopied("copied");
            } catch {
              // Clipboard access can be blocked by the browser; downloading still works.
              setCopied("failed");
            }
            window.setTimeout(() => setCopied("idle"), 2000);
          }}
        >
          <span aria-live="polite">{copied === "copied" ? "Copied" : copied === "failed" ? "Couldn't copy, try Download" : "Copy"}</span>
        </button>
      ) : null}
    </>
  );
}

function FileCard({ kind, title, description, files, actions, viewable = true }: { kind: string; title: string; description: string; files: Record<string, string>; actions: ReactNode; viewable?: boolean }) {
  const id = useId();
  return (
    <article className={styles.card} aria-labelledby={id}>
      <div className={styles.cardBody}>
        <p className={styles.kind}>{kind}</p>
        <h2 id={id} className={styles.cardTitle}>
          {title}
        </h2>
        <p className={styles.description}>{description}</p>
        <p className={styles.fileName}>
          {Object.keys(files).join(", ")} &middot; {formatSize(Object.values(files).reduce((sum, f) => sum + new Blob([f]).size, 0))}
        </p>
        <div className={styles.actions}>{actions}</div>
        {viewable ? <CodeViewer files={files} /> : null}
      </div>
    </article>
  );
}

function CodeViewer({ files }: { files: Record<string, string> }) {
  const names = Object.keys(files);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(names[0]);
  const id = useId();
  return (
    <div className={styles.viewer}>
      <button type="button" className={styles.viewerToggle} aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        {open ? "Hide" : "Look inside"}
      </button>
      <div id={id} hidden={!open}>
        {names.length > 1 ? (
          <div className={styles.viewerTabs} role="group" aria-label="Files">
            {names.map((name) => (
              <button key={name} type="button" className={styles.viewerTab} aria-pressed={active === name} onClick={() => setActive(name)}>
                {name}
              </button>
            ))}
          </div>
        ) : null}
        {open ? (
          <pre className={styles.code} tabIndex={0} aria-label={active}>
            <code>{files[active].length > 60_000 ? `${files[active].slice(0, 60_000)}\n\n… (download the file to see the rest)` : files[active]}</code>
          </pre>
        ) : null}
      </div>
    </div>
  );
}

function SocialCard({ format, render, dependency, fileName, onCanvas }: { format: SocialFormat; render: (canvas: HTMLCanvasElement) => Promise<void>; dependency: string; fileName: string; onCanvas: (canvas: HTMLCanvasElement | null) => void }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [state, setState] = useState<"drawing" | "ready" | "failed">("drawing");
  const renderRef = useRef(render);

  useEffect(() => {
    renderRef.current = render;
  });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let cancelled = false;
    renderRef.current(canvas)
      .then(() => !cancelled && setState("ready"))
      .catch(() => !cancelled && setState("failed"));
    return () => {
      cancelled = true;
    };
  }, [dependency]);

  const { label, width, height } = SOCIAL_FORMATS[format];
  return (
    <figure className={styles.socialCard}>
      <canvas
        ref={(node) => {
          ref.current = node;
          onCanvas(node);
        }}
        className={styles.canvas}
        style={{ aspectRatio: `${width} / ${height}` }}
        role="img"
        aria-label={`${label} preview`}
      />
      <figcaption className={styles.socialCaption}>
        <span>
          {label} &middot; {width}&times;{height}
        </span>
        <button
          type="button"
          className="ui-button ui-button--small"
          disabled={state !== "ready"}
          onClick={async () => {
            if (ref.current) download({ name: fileName, data: await canvasToPng(ref.current), type: "image/png" });
          }}
        >
          {state === "failed" ? "Couldn't draw" : "Download PNG"}
        </button>
      </figcaption>
    </figure>
  );
}

function formatSize(bytes: number) {
  return bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
