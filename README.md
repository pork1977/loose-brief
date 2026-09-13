# Loose Brief

An AI studio that takes a short business brief and turns it into three brand directions, a design token system and a working website.

Work in progress. The build plan and the decisions behind it are in [docs/plan.md](docs/plan.md).

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:3400.

Other scripts: `npm run build`, `npm run lint`, `npm run typecheck`.

## Where things live

| Path | What's in it |
| --- | --- |
| `src/app/(marketing)` | Landing page and "How it's built" |
| `src/app/(studio)` | The five project stages: brief, directions, brand system, studio, export |
| `src/lib/tokens.ts` | The brand token model and the compiler that turns it into CSS variables |
| `src/lib/brand-fonts.ts` | The curated fonts a brand can use |
| `src/data/demo-directions.ts` | The three built-in directions for Ebbfield, the fictional demo brand |
| `src/components/brand` | Components that only read brand tokens |
| `src/components/ui` | Loose Brief's own buttons, cards and panels |

## Two sets of tokens

Loose Brief's interface uses `--ui-*` variables. A generated brand uses `--color-*`, `--font-*`, `--radius-*` and so on, set only on a `BrandScope` wrapper, so editing a brand never restyles the editor around it.
