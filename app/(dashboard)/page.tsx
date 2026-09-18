import {
  ArrowUpRight,
  BookOpen,
  Clock,
  Ticket,
  Users,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { ActivityChart } from "@/components/dashboard/activity-chart"

const STATS = [
  {
    label: "Total Books",
    value: "142",
    accent: "bg-accent-purple",
    icon: BookOpen,
  },
  {
    label: "Total Members",
    value: "44",
    accent: "bg-accent-green",
    icon: Users,
  },
  {
    label: "Issued Books",
    value: "28",
    accent: "bg-primary",
    icon: ArrowUpRight,
  },
  {
    label: "Reserved Books",
    value: "13",
    accent: "bg-warning",
    icon: Ticket,
  },
  {
    label: "Overdue Loans",
    value: "5",
    accent: "bg-danger",
    icon: Clock,
  },
]

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-5">
        {STATS.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-start gap-4">
                <span
                  className={`${stat.accent} flex size-10 shrink-0 items-center justify-center rounded-lg text-white`}
                >
                  <Icon className="size-5" />
                </span>
                <div>
                  <div className="text-2xl font-bold tabular-nums text-text-primary">
                    {stat.value}
                  </div>
                  <div className="text-[13px] font-medium text-text-secondary">
                    {stat.label}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Library Activity</CardTitle>
            <CardDescription>
              Logged actions over the current week. Each action adds to the
              day&apos;s bar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity Feed</CardTitle>
            <CardDescription>Latest actions in the library.</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityFeed />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
