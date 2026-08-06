import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "default" | "primary" | "ghost" | "outline-brand";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "sm" | "md";
  variant?: ButtonVariant;
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  default:
    "border border-border bg-surface text-foreground hover:bg-surface-muted",
  primary:
    "border border-brand bg-brand text-foreground-inverse hover:border-brand-hover hover:bg-brand-hover",
  ghost:
    "border border-transparent bg-transparent text-foreground-secondary hover:bg-surface-muted hover:text-foreground",
  "outline-brand":
    "border border-brand bg-surface text-brand hover:bg-brand-soft",
};

export function Button({
  size = "md",
  variant = "default",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  const sizeClass =
    size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2 text-sm";

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-40 ${VARIANT_CLASS[variant]} ${sizeClass} ${className}`}
      {...props}
    />
  );
}
