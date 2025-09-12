"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

// ここを拡張
type Variant = "default" | "secondary" | "destructive" | "outline" | "ghost" | "link";
type Size = "default" | "sm" | "icon" | "lg";

export interface ButtonProps extends React.ComponentPropsWithoutRef<"button"> {
  asChild?: boolean;
  variant?: Variant;
  size?: Size;
}

const base =
  "inline-flex items-center justify-center rounded-xl border transition " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
  "disabled:opacity-50 disabled:pointer-events-none";

// ここを拡張
const variants: Record<Variant, string> = {
  default: "bg-primary text-primary-foreground hover:opacity-90 border-transparent",
  secondary: "bg-secondary text-secondary-foreground hover:opacity-90 border-transparent",
  destructive: "bg-destructive text-destructive-foreground hover:opacity-90 border-transparent",
  outline: "bg-transparent border-input text-foreground hover:bg-accent hover:text-accent-foreground",
  ghost: "bg-transparent text-foreground hover:bg-white/10 border-white/20",
  link: "bg-transparent border-transparent underline underline-offset-4 text-primary hover:no-underline",
};

const sizes: Record<Size, string> = {
  default: "h-10 px-4",
  sm: "h-8 px-3 text-sm",
  icon: "h-9 w-9 p-0",
  lg: "h-12 px-6 text-base",
};

export function buttonVariants(opts?: { variant?: Variant; size?: Size; className?: string }) {
  const v = opts?.variant ?? "default";
  const s = opts?.size ?? "default";
  return cn(base, variants[v], sizes[s], opts?.className);
}

export const Button = React.forwardRef<React.ElementRef<"button">, ButtonProps>(
  ({ asChild = false, className, variant = "default", size = "default", ...props }, ref) => {
    const Comp: React.ElementType = asChild ? Slot : "button";
    return <Comp ref={ref} className={buttonVariants({ variant, size, className })} {...props} />;
  }
);

Button.displayName = "Button";
