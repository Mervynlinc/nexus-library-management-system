"use client"

import { useEffect, useState } from "react"

import { getActivityFeed, subscribeActivity } from "@/lib/activity"
import { cn } from "@/lib/utils"

/** Days of the week, left to right. Index 0..6 = Mon..Sun. */
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
/**
 * Height added to a bar per logged activity (14% of the chart).
 * So one activity visibly grows the bar by exactly one unit and a full bar
 * is reached after ~7 activities. 100% is the effective ceiling.
 */
const HEIGHT_PER_ACTIVITY = 14

/**
 * Counts how many activities fell on each day of the current week.
 *
 * Week = Monday..Sunday. We compute Monday of whatever "today" is, then bucket
 * every activity by the local weekday of its timestamp. Entries older than
 * that Monday are ignored (previous week).
 */
function weeklyCounts(): number[] {
  const now = new Date()
  // (getDay()+6)%7 converts JS's weekday (Sun=0..Sat=6) to Mon=0..Sun=6.
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

/**
 * ActivityChart — the week bar chart ("Library Activity" card).
 *
 * Like ActivityFeed it starts from zeros and fills in useEffect (hydration
 * safety: the server prerender must not render browser-local data), and it
 * subscribes to the same activity events so bars bump live when a toast fires.
 */
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
      {/* Bars grow from the bottom: container is h-64, each bar's height is a % of it. */}
      <div className="flex h-64 items-end gap-4 border-b border-border">
        {counts.map((count, i) => {
          // Each activity adds a fixed HEIGHT_PER_ACTIVITY%, capped at 100%.
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
      {/* Day labels under the bars; hover tooltip on a bar shows its count. */}
      <div className="mt-2 flex justify-between text-xs text-text-secondary">
        {DAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  )
}