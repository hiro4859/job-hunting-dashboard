"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

type DivProps = React.HTMLAttributes<HTMLDivElement>

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen bg-background">{children}</div>
}

export function SidebarInset({ children }: { children: React.ReactNode }) {
  return <div className="flex-1">{children}</div>
}

export function Sidebar({ className, collapsible, ...props }: DivProps & { collapsible?: "none" | "icon" }) {
  return <aside className={cn("flex flex-col bg-sidebar text-sidebar-foreground", className)} {...props} />
}
export function SidebarContent(props: DivProps) { return <div {...props} /> }
export function SidebarGroup(props: DivProps) { return <div {...props} /> }
export function SidebarGroupContent(props: DivProps) { return <div {...props} /> }
export function SidebarMenu(props: DivProps) { return <nav {...props} /> }

export function SidebarMenuItem(props: DivProps) { return <div {...props} /> }

export function SidebarMenuButton({
  asChild,
  isActive,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean; isActive?: boolean }) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(
        "w-full h-10 rounded-xl px-2 text-left data-[active=true]:bg-primary data-[active=true]:text-primary-foreground",
        className
      )}
      data-active={isActive ? "true" : "false"}
      {...props}
    />
  )
}
