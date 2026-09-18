"use client"

import { useEffect, useState } from "react"

import {
  getActivityFeed,
  subscribeActivity,
} from "@/lib/activity"
import { cn } from "@/lib/utils"

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const HEIGHT_PER_ACTIVITY = 14

function weeklyCounts(): number[] {
  const now = new Date()
  const monday = new Date(now)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))

  const counts = DAY_LABELS.map(() => 0)
  for (const item of getActivityFeed()) {
    const date = new Date(item.timestamp)
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    if (startOfDay.getTime() < monday.getTime()) continue
    counts[(date.getDay() + 6) % 7] += 1
  }
  return counts
}

export function ActivityChart() {
  const [counts, setCounts] = useState<number[]>(() =>
    DAY_LABELS.map(() => 0)
  )

  useEffect(() => {
    const refresh = () => setCounts(weeklyCounts())
    refresh()
    return subscribeActivity(refresh)
  }, [])

  return (
    <div>
      <div className="flex h-64 items-end gap-4 border-b border-border">
        {counts.map((count, i) => {
          const height = Math.min(100, count * HEIGHT_PER_ACTIVITY)
          return (
            <div
              key={i}
              title={`${DAY_LABELS[i]}: ${count} ${count === 1 ? "activity" : "activities"}`}
              className={cn(
                "flex-1 rounded-t-md transition-[height] duration-500 ease-out",
                i % 2 === 0 ? "bg-primary/80" : "bg-primary-tint"
              )}
              style={{ height: `${height}%`, minHeight: count > 0 ? "8px" : 0 }}
            />
          )
        })}
      </div>
      <div className="mt-2 flex justify-between text-xs text-text-secondary">
        {counts.map((count, i) => (
          <span key={i} className="flex flex-col items-center gap-0.5">

            {DAY_LABELS[i]}
          </span>
        ))}
      </div>
    </div>
  )
}