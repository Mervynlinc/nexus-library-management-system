"use client"

import { useEffect, useState } from "react"
import { CircleAlert, CircleCheck } from "lucide-react"

import {
  getActivityFeed,
  subscribeActivity,
  timeAgo,
  type ActivityItem,
} from "@/lib/activity"

/**
 * ActivityFeed — the list shown on the dashboard.
 *
 * Why start empty? Next.js prerenders this page as static HTML at build time.
 * If we rendered localStorage data on the first client render instead of
 * waiting for the browser, the pre-rendered markup and the client DOM would
 * differ (different timestamps) -> React hydration mismatch. So we start with
 * [] and populate inside useEffect, which only runs in the browser.
 */
export function ActivityFeed() {
  const [items, setItems] = useState<ActivityItem[]>([])

  useEffect(() => {
    // refresh loads the feed and is re-invoked on every change.
    const refresh = () => setItems(getActivityFeed())
    refresh()
    // subscribeActivity returns the cleanup function React calls on unmount,
    // so we never leak event listeners.
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
          {/* The icon follows the variant: errors are red, everything else green. */}
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