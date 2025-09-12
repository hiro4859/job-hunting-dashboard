"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

type Ctx = {
  value?: string
  onValueChange?: (v: string) => void
  items: Array<{ value: string; label: string }>
  registerItem: (value: string, label: string) => void
}
const SelectContext = React.createContext<Ctx | null>(null)

export function Select({
  value,
  onValueChange,
  children,
}: {
  value?: string
  onValueChange?: (v: string) => void
  children: React.ReactNode
}) {
  const [items, setItems] = React.useState<Array<{ value: string; label: string }>>([])
  const registerItem = React.useCallback((value: string, label: string) => {
    setItems((prev) => (prev.find((i) => i.value === value) ? prev : [...prev, { value, label }]))
  }, [])
  return (
    <SelectContext.Provider value={{ value, onValueChange, items, registerItem }}>
      <div className="relative inline-block">{children}</div>
    </SelectContext.Provider>
  )
}

export function SelectTrigger({
  className,
  children, // <SelectValue /> が入ってくるが、ここでは表示だけ。実操作は <select> に委譲。
}: React.HTMLAttributes<HTMLDivElement>) {
  const ctx = React.useContext(SelectContext)!
  return (
    <div className={cn("relative", className)}>
      <select
        className={cn(
          "appearance-none w-full h-10 rounded-xl bg-white/10 border border-white/20 px-3 pr-6"
        )}
        value={ctx.value}
        onChange={(e) => ctx.onValueChange?.(e.target.value)}
      >
        {ctx.items.map((it) => (
          <option key={it.value} value={it.value}>
            {it.label}
          </option>
        ))}
      </select>
      {/* 表示用 */}
      <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-sm text-foreground/70">
        
      </div>
      <div className="hidden">{children}</div>
    </div>
  )
}

export function SelectValue(props: { placeholder?: string }) {
  const ctx = React.useContext(SelectContext)!
  const label = ctx.items.find((i) => i.value === ctx.value)?.label ?? props.placeholder ?? ""
  return <span>{label}</span>
}

export function SelectContent({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  // ネイティブ <select> を使う簡易版なので描画は不要。ただし <SelectItem> を登録するために children は受ける。
  return <div className={cn("hidden", className)}>{children}</div>
}

export function SelectItem({
  value,
  children,
  className,
}: { value: string } & React.HTMLAttributes<HTMLDivElement>) {
  const ctx = React.useContext(SelectContext)!
  React.useEffect(() => {
    const label = typeof children === "string" ? children : String(value)
    ctx.registerItem(value, label)
  }, [ctx, value, children])
  // 表示はしない（ネイティブselectへ登録済み）
  return <div className={cn("hidden", className)} data-value={value}>{children}</div>
}
