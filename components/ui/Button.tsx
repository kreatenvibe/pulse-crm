import type { ButtonHTMLAttributes } from "react";

type ButtonVariant =
  | "default"
  | "primary"
  | "ghost"
  | "outline-brand"
  | "destructive";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "sm" | "md";
  variant?: ButtonVariant;
};

// Stitch button treatments: solid red primary, bordered secondary, red
// outline/ghost, error destructive. Radius/height stay crisp for density.
const VARIANT_CLASS: Record<ButtonVariant, string> = {
  default:
    "border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low",
  primary:
    "border border-brand bg-brand text-foreground-inverse hover:border-brand-hover hover:bg-brand-hover",
  ghost:
    "border border-transparent bg-transparent text-brand hover:bg-brand-soft",
  "outline-brand":
    "border border-brand bg-transparent text-brand hover:bg-brand-soft",
  destructive:
    "border border-error bg-error text-on-error hover:border-on-error-container hover:bg-on-error-container",
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
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-40 ${VARIANT_CLASS[variant]} ${sizeClass} ${className}`}
      {...props}
    />
  );
}
