import {
  BookOpen,
  CircleDollarSign,
  ClipboardList,
  LayoutDashboard,
  Repeat,
  Stamp,
  Users,
  UsersRound,
} from "lucide-react"

export interface NavItem {
  title: string
  url: string
  icon: typeof LayoutDashboard
}

export const dashboardNav: NavItem[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Books",
    url: "/books",
    icon: BookOpen,
  },
  {
    title: "Loans",
    url: "/circulation",
    icon: Repeat,
  },
  {
    title: "Members",
    url: "/members",
    icon: Users,
  },
  {
    title: "Fines / Penalties",
    url: "/fines",
    icon: CircleDollarSign,
  },
  {
    title: "Authors",
    url: "/authors",
    icon: UsersRound,
  },
  {
    title: "Publishers",
    url: "/publishers",
    icon: Stamp,
  },
  {
    title: "Membership Plans",
    url: "/membership-plans",
    icon: ClipboardList,
  },
]
