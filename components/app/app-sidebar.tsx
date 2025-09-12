"use client"

import { Home, Building2, Mail, FileSearch, CalendarRange, Settings } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const menuItems = [
  { title: "ホーム", url: "/", icon: Home, tooltip: "ホーム" },
  { title: "企業", url: "/company", icon: Building2, tooltip: "企業管理" },
  { title: "メール生成", url: "/company/mail/generate", icon: Mail, tooltip: "メール生成" },
  { title: "メール解析", url: "/company/mail/parse", icon: FileSearch, tooltip: "メール解析" },
  { title: "ロードマップ", url: "/roadmap", icon: CalendarRange, tooltip: "選考ロードマップ" },
  { title: "設定", url: "/settings", icon: Settings, tooltip: "設定" },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  return (
    <Sidebar collapsible="none" className={`glass-panel border-white/20 transition-all duration-300 ${hoveredItem ? "w-48" : "w-16"}`}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.url)}
                    className="transition-all duration-300 hover:bg-white/20 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:border-l-4 data-[active=true]:border-l-primary h-12 justify-start"
                    onMouseEnter={() => setHoveredItem(item.title)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <Link href={item.url} className="flex items-center gap-3 px-3">
                      <item.icon className="size-5 flex-shrink-0" />
                      <span className={`text-sm font-medium transition-all duration-300 ${hoveredItem === item.title ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"}`}>
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
