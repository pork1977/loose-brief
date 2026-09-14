# Loose Brief

Loose Brief turns a short business brief into three brand directions, a design system built from design tokens, and a homepage you can edit and download.

Write a brief (or load the demo one), pick one of three directions, edit its colours, type, voice and copy, ask the Creative Director for changes, and export the result: a static website, CSS variables, design token JSON, a Tailwind theme, `DESIGN.md`, brand guidelines, a copy deck and social images.

The demo brand, **Ebbfield**, is a made-up coastal data company.

## What's AI and what isn't

- **The Ebbfield demo uses no AI.** Its three directions were written in advance, and the Creative Director's suggestions are rules written in advance. The app labels both.
- **Your own brief uses Claude** when live mode is on. Claude plans three routes and writes each direction, picks shapes for its illustration, reads any images or PDFs you choose to share and your current website, and handles Creative Director requests the rules don't cover. Everything it returns is checked against the same strict schemas as the demo data before it's shown, and labelled as made by Claude.
- **Everything else is ordinary code**: the brand editor, contrast checks, undo and redo, the homepage and every export.
- **Nothing is stored on a server.** Projects are saved in the browser, and exports are made there.

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:3400. The demo works without any setup.

Other scripts: `npm run build`, `npm run lint`, `npm run typecheck`, `npm test`.

### Live mode

Copy `.env.example` to `.env.local` and add an `ANTHROPIC_API_KEY`. Use a key made only for this, with a spend limit set in the Anthropic console: the per-visitor limits in the app are counted in memory, so that spend limit is the real ceiling.

- The model defaults to Claude Sonnet 5 and can be changed with `LIVE_MODEL`.
- A brief takes about a minute and, measured on Sonnet 5, costs around $0.16.
- `LIVE_FAKE=1` in `.env.development.local` replays the demo through the live screens without calling the API, for working on the interface.

## How it's built

The app has its own page explaining this in more detail ("How it's built", linked from the header). In short:

- **Design tokens.** A brand is a set of named values (colours for light and dark mode, fonts, spacing, corners, shadow, motion), checked by a strict schema and compiled to CSS custom properties on a wrapper around the preview. The app's own interface uses a separate `--ui-*` set, so editing a brand never restyles the editor.
- **One project, one history.** Every change goes through a single reducer, which is what makes undo and redo work across the brand system, the Studio and the Creative Director. The project is saved in `localStorage` with a version number, and older saves are upgraded when they load.
- **One homepage component.** The Studio shows it in real desktop, tablet and mobile widths using container queries, and the download renders the same component to static HTML with the same stylesheet.
- **Claude fills a smaller shape than it's shown.** It makes the creative choices, and the app does the mechanical parts (the second colour mode, contrast fixes, spacing, presets) before the result goes through the strict schema. A whole direction is too complex for one structured reply, so each is written as two requests after a planning request.

Stack: Next.js 16, React 19, TypeScript, plain CSS in cascade layers, Zod, fflate for zips, the Anthropic SDK on the server, and Node's built-in test runner.

## Where things live

| Path | What's in it |
| --- | --- |
| `src/app/(marketing)` | Landing page and "How it's built" |
| `src/app/(studio)` | The five project stages: brief, directions, brand system, studio, export |
| `src/app/api` | Live mode routes: `live` (is it switched on), `directions` and `refine` |
| `src/lib/tokens.ts` | The brand token model and the compiler that turns it into CSS variables |
| `src/lib/direction.ts` | The schema every brand direction has to pass, built-in or generated |
| `src/lib/brief.ts` | The brief schema and the checks for each step |
| `src/lib/website.ts` | The homepage as data: section schema, order and limits |
| `src/lib/accessibility.ts` | WCAG contrast checks on a brand's tokens, and nearest passing colours |
| `src/lib/color-modes.ts` | Deriving a dark colour set from a light one (and back), and the contrast control |
| `src/lib/palette.ts` | Colour extraction from uploaded images, run in the browser |
| `src/lib/motifs.ts` | The drawn shapes illustrations are built from |
| `src/lib/refinement.ts` | The Creative Director's built-in rules |
| `src/lib/live` | Live mode: the draft shape Claude fills in, prompts, generation steps, limits, reading a website safely and the SDK call |
| `src/lib/export` | The downloads: static site, site script, documents, social images and zips |
| `src/lib/exporters.ts` | CSS variables, W3C design token JSON and the Tailwind v4 theme |
| `src/state` | Project state: a pure reducer, a store that saves and restores it, and the Creative Director's messages |
| `src/components/website` | The homepage, rendered only from brand tokens, and its shared stylesheet |
| `src/components/brand` | Components that only read brand tokens, including the illustrations |
| `src/components/brand-system` | The brand system editor |
| `src/components/studio` | The Studio: device frames, section list, before and after, the Creative Director, and the stage bar |
| `src/components/directions` | Direction cards, the identity canvas, compare view and live generation screen |
| `src/data` | The Ebbfield demo brief and directions |
| `scripts/write-demo-export.tsx` | Writes the demo brand's full export to a folder, for checking outside the app |
| `docs/plan.md` | The build plan and the decisions made along the way |

## Credits

Loose Brief is Paul Wilson's project: the idea, the decisions and testing every section. The code was written with Claude Code.
