// components/ui/slider.tsx
"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "./utils";

type RootType = typeof SliderPrimitive.Root;

/** Radix Slider の薄いラッパー（型エラーが出ない安定版） */
export type SliderProps = React.ComponentPropsWithoutRef<RootType> & {
  className?: string;
};

export const Slider = React.forwardRef<
  React.ElementRef<RootType>,
  SliderProps
>(({ className, value, defaultValue, ...props }, ref) => {
  // Thumb の本数は value / defaultValue の配列長から推定
  const thumbs = React.useMemo<number[]>(
    () =>
      Array.isArray(value)
        ? (value as number[])
        : Array.isArray(defaultValue)
        ? (defaultValue as number[])
        : [0],
    [value, defaultValue]
  );

  return (
    <SliderPrimitive.Root
      ref={ref}
      value={value}
      defaultValue={defaultValue}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        "data-[orientation=vertical]:h-44 data-[orientation=vertical]:w-2.5",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-muted">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>

      {thumbs.map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          className={cn(
            "block size-4 rounded-full border border-primary bg-background shadow",
            "transition-shadow focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/50",
            "disabled:opacity-50"
          )}
        />
      ))}
    </SliderPrimitive.Root>
  );
});
Slider.displayName = "Slider";
