# Loose Brief

An AI studio that takes a short business brief and turns it into three brand directions, a design token system and a working website.

Work in progress. The build plan and the decisions behind it are in [docs/plan.md](docs/plan.md).

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:3400.

Other scripts: `npm run build`, `npm run lint`, `npm run typecheck`, `npm test`.

Live mode (Claude writing directions from your own brief) needs `ANTHROPIC_API_KEY` in `.env.local`. See `.env.example` for that and the optional limits. Without a key the Ebbfield demo works as normal. `LIVE_FAKE=1` in `.env.development.local` replays the demo through the live screens without calling the API.

## Where things live

| Path | What's in it |
| --- | --- |
| `src/app/(marketing)` | Landing page and "How it's built" |
| `src/app/(studio)` | The five project stages: brief, directions, brand system, studio, export |
| `src/lib/tokens.ts` | The brand token model and the compiler that turns it into CSS variables |
| `src/lib/brand-fonts.ts` | The curated fonts a brand can use |
| `src/lib/brief.ts` | The brief schema and the checks for each step |
| `src/lib/palette.ts` | Colour extraction from uploaded images, run in the browser |
| `src/lib/direction.ts` | The schema every brand direction has to pass, built-in or generated |
| `src/lib/accessibility.ts` | WCAG contrast checks on a brand's tokens, and nearest passing colours |
| `src/components/directions` | Direction cards, the identity canvas and the compare view |
| `src/lib/color-modes.ts` | Deriving a dark colour set from a light one (and back), and the contrast control |
| `src/lib/token-registry.ts` | What every token is for and which parts of the site use it |
| `src/lib/health.ts` | The identity health checks |
| `src/lib/exporters.ts` | CSS variables, W3C design token JSON and the Tailwind v4 theme |
| `src/lib/export` | The downloads: static site, site.js, documents, social cards and zips |
| `src/lib/live` | Live mode: the draft shape Claude fills in, prompts, the generation steps, limits and the SDK call |
| `src/app/api` | The live routes: `live` (is it on), `directions` and `refine` |
| `src/components/export` | The Export page |
| `src/components/website/site-css.ts` | The homepage stylesheet, shared by the Studio preview and the downloaded site |
| `src/lib/coastline.ts` | The illustrative coastline data and the frame for any year |
| `scripts/write-demo-export.tsx` | Writes the demo brand's full export to a folder, for checking outside the app |
| `src/components/brand-system` | The brand system editor: tabs, controls and live preview |
| `src/lib/website.ts` | The homepage as data: section schema, order and limits |
| `src/components/website` | The generated homepage, rendered only from brand tokens, and the coastline explorer |
| `src/components/studio` | The Studio: device frames, section list, before-and-after and the Creative Director panel |
| `src/lib/refinement.ts` | The Creative Director's built-in rules: matching requests and planning changes |
| `src/state/director.ts` | Turning a request into a validated, previewable proposal |
| `src/state` | Project state: a pure reducer, and a store that saves it in the browser and restores it safely |
| `src/state/project-actions.ts` | Restarting the demo and starting over, shared by every screen that offers them |
| `src/components/studio/ProjectMenu.tsx`, `DemoTour.tsx` | The Project menu and the demo tour shown on each stage |
| `src/data/demo-brief.ts` | The Ebbfield demo brief |
| `src/data/demo-directions.ts` | The three built-in directions for Ebbfield, the fictional demo brand |
| `src/components/brand` | Components that only read brand tokens |
| `src/components/ui` | Loose Brief's own buttons, cards and panels |

## Two sets of tokens

Loose Brief's interface uses `--ui-*` variables. A generated brand uses `--color-*`, `--font-*`, `--radius-*` and so on, set only on a `BrandScope` wrapper, so editing a brand never restyles the editor around it.
