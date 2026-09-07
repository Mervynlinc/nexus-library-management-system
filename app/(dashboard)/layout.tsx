import type { ReactNode } from "react"

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { DashboardHeader } from "@/components/dashboard/header"

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader />
        <div className="bg-bg flex flex-1 flex-col">
          <div className="p-6 md:p-8">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}