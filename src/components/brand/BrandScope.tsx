import type { CSSProperties, ComponentProps } from "react";
import { compileTokens, type BrandTokens } from "@/lib/tokens";

type BrandScopeProps = { tokens: BrandTokens } & ComponentProps<"div">;

/**
 * Applies a brand's tokens as CSS custom properties to everything inside it,
 * and nothing outside it. Components rendered inside read var(--color-*),
 * var(--font-*) and so on, and never hold brand values of their own.
 */
export function BrandScope({ tokens, className, style, ...props }: BrandScopeProps) {
  const vars = compileTokens(tokens) as CSSProperties;
  return (
    <div
      className={["brand-scope", className].filter(Boolean).join(" ")}
      style={{ ...vars, ...style }}
      {...props}
    />
  );
}
