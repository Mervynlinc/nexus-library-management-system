"use client"

import { BookMarked } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { apiFetch } from "@/lib/api"
import { useToast } from "@/components/ui/toast"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { dashboardNav } from "@/config/nav"

export function AppSidebar() {
  const pathname = usePathname()
  const toast = useToast()
  async function logout() {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" })
      window.location.replace("/login")
    } catch (err) {
      toast({ variant: "error", title: "Sign out failed", description: err instanceof Error ? err.message : "Try again" })
    }
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="Nexus Library System"
              className="h-12"
              asChild
            >
              <Link href="/">
                <div className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-md">
                  <BookMarked className="size-4" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-base font-semibold">Nexus</span>
                  <span className="text-muted-foreground text-xs">
                    Library Management System
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {dashboardNav.map((item) => {
                const Icon = item.icon
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={pathname === item.url}
                    >
                      <Link href={item.url}>
                        <Icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Sign out"
              className="text-muted-foreground"
            >
              <button onClick={logout}>
                <span>Sign out</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
