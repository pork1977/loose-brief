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
| `src/lib/exporters.ts` | CSS variables and W3C design token JSON |
| `src/components/brand-system` | The brand system editor: tabs, controls and live preview |
| `src/lib/website.ts` | The homepage as data: section schema, order and limits |
| `src/components/website` | The generated homepage, rendered only from brand tokens, and the coastline explorer |
| `src/components/studio` | The Studio: device frames, section list and before-and-after |
| `src/state` | Project state: a pure reducer, and a store that saves it in the browser and restores it safely |
| `src/data/demo-brief.ts` | The Ebbfield demo brief |
| `src/data/demo-directions.ts` | The three built-in directions for Ebbfield, the fictional demo brand |
| `src/components/brand` | Components that only read brand tokens |
| `src/components/ui` | Loose Brief's own buttons, cards and panels |

## Two sets of tokens

Loose Brief's interface uses `--ui-*` variables. A generated brand uses `--color-*`, `--font-*`, `--radius-*` and so on, set only on a `BrandScope` wrapper, so editing a brand never restyles the editor around it.
