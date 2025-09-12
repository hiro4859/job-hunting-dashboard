"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type Variant = "default" | "ghost";
type Size = "default" | "sm" | "icon" | "lg"


export interface ButtonProps extends React.ComponentPropsWithoutRef<"button"> {
  asChild?: boolean;
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<React.ElementRef<"button">, ButtonProps>(
  ({ asChild = false, className, variant = "default", size = "default", ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    const base =
      "inline-flex items-center justify-center rounded-xl border transition " +
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
      "disabled:opacity-50 disabled:pointer-events-none";

    const variants: Record<Variant, string> = {
      default: "bg-primary text-primary-foreground hover:opacity-90 border-transparent",
      ghost: "bg-transparent text-foreground hover:bg-white/10 border-white/20",
    };

    const sizes: Record<Size, string> = {
      default: "h-10 px-4",
      sm: "h-8 px-3 text-sm",
      icon: "h-9 w-9 p-0",
      lg: "h-12 px-6 text-base",
    };

    return (
      <Comp
        ref={ref as any}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
