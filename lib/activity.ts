export type ActivityVariant = "success" | "error"

export interface ActivityItem {
  id: string
  title: string
  description?: string
  variant: ActivityVariant
  timestamp: number
}

const STORAGE_KEY = "nexus-lms-activity-feed"
const MAX_ACTIVITIES = 50
const EVENT_NAME = "nexus-lms-activity"

const SEED_MINUTES = [2, 18, 60, 180, 26 * 60]

const SEED_ACTIVITIES: Pick<
  ActivityItem,
  "title" | "description" | "variant"
>[] = [
  {
    variant: "success",
    title: 'J. Carter returned "The Pragmatic Programmer"',
  },
  {
    variant: "success",
    title: "New member M. Okoro registered",
  },
  {
    variant: "success",
    title: "Book #B-034 checked out to A. Silva",
  },
  {
    variant: "error",
    title: "Fine of $2.50 waived for member P. Novak",
  },
  {
    variant: "success",
    title: '3 copies added to "Clean Architecture"',
  },
]

function readStoredFeed(): ActivityItem[] | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    return parsed.filter(
      (entry): entry is ActivityItem =>
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as ActivityItem).id === "string" &&
        typeof (entry as ActivityItem).title === "string" &&
        typeof (entry as ActivityItem).timestamp === "number"
    )
  } catch {
    return null
  }
}

export function getActivityFeed(): ActivityItem[] {
  const stored = readStoredFeed()
  if (stored) return stored

  const now = Date.now()
  const seeds: ActivityItem[] = SEED_ACTIVITIES.map((entry, index) => ({
    id: `seed-${index}`,
    ...entry,
    timestamp: now - SEED_MINUTES[index] * 60_000,
  }))
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeds))
  } catch {
    // Storage may be unavailable (private mode); the feed still works in-memory.
  }
  return seeds
}

export function addActivity(
  entry: Pick<ActivityItem, "title" | "description" | "variant">
) {
  if (typeof window === "undefined") return
  const item: ActivityItem = {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `activity-${Date.now()}`,
    ...entry,
    timestamp: Date.now(),
  }
  const next = [item, ...getActivityFeed()].slice(0, MAX_ACTIVITIES)
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Non-fatal: event listeners below still refresh in-memory state.
  }
  window.dispatchEvent(new Event(EVENT_NAME))
}

export function subscribeActivity(listener: () => void): () => void {
  window.addEventListener(EVENT_NAME, listener)
  window.addEventListener("storage", listener)
  return () => {
    window.removeEventListener(EVENT_NAME, listener)
    window.removeEventListener("storage", listener)
  }
}

export function timeAgo(timestamp: number): string {
  const minutes = Math.floor((Date.now() - timestamp) / 60_000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return "Yesterday"
  return `${days} days ago`
}