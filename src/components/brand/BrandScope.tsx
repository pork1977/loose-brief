import type { CSSProperties, ComponentProps } from "react";
import { compileTokens, type BrandTokens, type Mode } from "@/lib/tokens";

type BrandScopeProps = { tokens: BrandTokens; mode?: Mode } & ComponentProps<"div">;

/**
 * Applies a brand's tokens as CSS custom properties to everything inside it,
 * and nothing outside it. Components rendered inside read var(--color-*),
 * var(--font-*) and so on, and never hold brand values of their own.
 * `mode` picks the light or dark colour set; by default, the one the brand leads with.
 */
export function BrandScope({ tokens, mode, className, style, ...props }: BrandScopeProps) {
  const vars = compileTokens(tokens, mode) as CSSProperties;
  const activeMode = mode ?? tokens.mode;
  return (
    <div
      className={["brand-scope", className].filter(Boolean).join(" ")}
      data-brand-mode={activeMode}
      style={{ ...vars, colorScheme: activeMode, ...style }}
      {...props}
    />
  );
}
