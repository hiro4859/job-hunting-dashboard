"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "./utils";

type Variants = "default" | "secondary" | "outline" | "destructive";
type Sizes = "default" | "sm" | "md" | "lg" | "icon";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: Variants;
  size?: Sizes;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 disabled:opacity-50 disabled:pointer-events-none";

const variantClass: Record<Variants, string> = {
  default: "bg-slate-900 text-white hover:bg-slate-800",
  secondary:
    "bg-white/80 text-slate-800 ring-1 ring-slate-200 hover:bg-white",
  outline:
    "bg-transparent text-slate-800 ring-1 ring-slate-300 hover:bg-white",
  destructive: "bg-red-600 text-white hover:bg-red-700",
};

const sizeClass: Record<Sizes, string> = {
  // "default" を md と同じにする（好みで調整OK）
  default: "h-9 px-3 text-sm",
  sm: "h-8 px-2 text-sm",
  md: "h-9 px-3 text-sm",
  lg: "h-10 px-4 text-base",
  icon: "h-9 w-9 p-0",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, asChild = false, variant = "default", size = "md", ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(base, variantClass[variant], sizeClass[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

// 既存の exports の下に追記
export function buttonVariants(opts?: {
  variant?: Variants;
  size?: Sizes;
  className?: string;
}) {
  const v = opts?.variant ?? "default";
  const s = opts?.size ?? "md";
  return cn(base, variantClass[v], sizeClass[s], opts?.className);
}
