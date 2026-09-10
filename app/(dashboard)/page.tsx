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

const ACTIVITY_FEED = [
  {
    text: "J. Carter returned \"The Pragmatic Programmer\"",
    time: "2 min ago",
  },
  {
    text: "New member M. Okoro registered",
    time: "18 min ago",
  },
  {
    text: "Book #B-034 checked out to A. Silva",
    time: "1 hr ago",
  },
  {
    text: "Fine of $2.50 waived for member P. Novak",
    time: "3 hrs ago",
  },
  {
    text: "3 copies added to \"Clean Architecture\"",
    time: "Yesterday",
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
              Issued, returned and overdue items over time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-end gap-4 border-b border-border">
              {[40, 65, 50, 80, 60, 90, 72].map((height, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-t-md ${
                    i % 2 === 0 ? "bg-primary/80" : "bg-primary-tint"
                  }`}
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs text-text-secondary">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity Feed</CardTitle>
            <CardDescription>Latest actions in the library.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {ACTIVITY_FEED.map((item, i) => (
              <div key={i} className="flex flex-col gap-1">
                <p className="text-sm text-text-primary">{item.text}</p>
                <span className="text-xs text-text-secondary">
                  {item.time}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
