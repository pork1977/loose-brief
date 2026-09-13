import type { HTMLAttributes, ReactNode } from "react";

type CardProps = {
  raised?: boolean;
  interactive?: boolean;
  as?: "div" | "article" | "li" | "section";
} & HTMLAttributes<HTMLElement>;

export function Card({ raised, interactive, as: Tag = "div", className, ...props }: CardProps) {
  const classes = ["ui-card", raised && "ui-card--raised", interactive && "ui-card--interactive", className]
    .filter(Boolean)
    .join(" ");
  return <Tag className={classes} {...props} />;
}

export function CardTitle({ children, as: Tag = "h3" }: { children: ReactNode; as?: "h2" | "h3" | "h4" }) {
  return <Tag className="ui-card__title">{children}</Tag>;
}

export function CardBody({ children }: { children: ReactNode }) {
  return <div className="ui-card__body">{children}</div>;
}
