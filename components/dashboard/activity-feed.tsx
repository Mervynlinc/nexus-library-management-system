"use client"

import { useEffect, useState } from "react"
import { CircleAlert, CircleCheck } from "lucide-react"

import {
  getActivityFeed,
  subscribeActivity,
  timeAgo,
  type ActivityItem,
} from "@/lib/activity"

export function ActivityFeed() {
  const [items, setItems] = useState<ActivityItem[]>([])

  useEffect(() => {
    const refresh = () => setItems(getActivityFeed())
    refresh()
    return subscribeActivity(refresh)
  }, [])

  if (items.length === 0) {
    return (
      <p className="text-sm text-text-secondary">
        No activity yet. Actions that produce a toast will appear here.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => (
        <div key={item.id} className="flex items-start gap-2.5">
          {item.variant === "error" ? (
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-danger" />
          ) : (
            <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" />
          )}
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="text-sm text-text-primary">{item.title}</p>
            {item.description ? (
              <p className="text-xs text-text-secondary">{item.description}</p>
            ) : null}
            <span className="text-xs text-text-secondary">
              {timeAgo(item.timestamp)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}