import { SidebarTrigger } from "@/components/ui/sidebar"

const CURRENT_USER = {
  name: "Jane Carter",
  role: "Administrator",
} as const

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

export function DashboardHeader() {
  return (
    <header className="flex shrink-0 items-center justify-between gap-4 px-6 py-4 md:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger />
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-text-primary">
            Library Management System
          </h1>
          <p className="text-[13px] text-text-secondary">
            Welcome, {CURRENT_USER.name}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden flex-col items-end sm:flex">
          <span className="text-sm font-medium text-text-primary">
            {CURRENT_USER.name}
          </span>
          <span className="text-xs text-text-secondary">
            {CURRENT_USER.role}
          </span>
        </div>
        <span
          aria-hidden="true"
          className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
        >
          {initials(CURRENT_USER.name)}
        </span>
      </div>
    </header>
  )
}