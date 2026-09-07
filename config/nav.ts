import {
  BookOpen,
  Boxes,
  CircleDollarSign,
  ClipboardList,
  LayoutDashboard,
  Repeat,
  Stamp,
  Ticket,
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
    title: "Copies / Inventory",
    url: "/copies",
    icon: Boxes,
  },
  {
    title: "Circulation",
    url: "/circulation",
    icon: Repeat,
  },
  {
    title: "Reservations",
    url: "/reservations",
    icon: Ticket,
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
