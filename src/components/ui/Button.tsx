import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "small" | "medium" | "large";

type StyleProps = {
  variant?: Variant;
  size?: Size;
  /** Square button for a single icon. Needs an aria-label. */
  icon?: boolean;
};

function buttonClass({ variant = "secondary", size = "medium", icon }: StyleProps, extra?: string) {
  return [
    "ui-button",
    variant !== "secondary" && `ui-button--${variant}`,
    size !== "medium" && `ui-button--${size}`,
    icon && "ui-button--icon",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

export function Button({
  variant,
  size,
  icon,
  className,
  type = "button",
  ...props
}: StyleProps & ComponentProps<"button">) {
  return <button type={type} className={buttonClass({ variant, size, icon }, className)} {...props} />;
}

export function ButtonLink({
  variant,
  size,
  icon,
  className,
  ...props
}: StyleProps & ComponentProps<typeof Link>) {
  return <Link className={buttonClass({ variant, size, icon }, className)} {...props} />;
}
