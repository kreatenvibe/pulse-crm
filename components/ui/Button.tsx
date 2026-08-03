import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "sm" | "md";
};

export function Button({
  size = "md",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  const sizeClass =
    size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm";

  return (
    <button
      type={type}
      className={`rounded border border-zinc-300 hover:bg-zinc-50 ${sizeClass} ${className}`}
      {...props}
    />
  );
}
