/**
 * Activity log.
 *
 * Every toast raised anywhere on the frontend is stored here as an activity
 * and shown on the dashboard (feed + weekly chart). The feed is persisted in
 * the browser's localStorage so it survives route changes and reloads — there
 * is no server backing this yet, which is why it is per-browser.
 */

/** Successful action (green) vs. error (red) — drives the feed icons. */
export type ActivityVariant = "success" | "error"

export interface ActivityItem {
  id: string
  title: string
  description?: string
  variant: ActivityVariant
  timestamp: number
}

/** localStorage key under which the whole feed is stored. */
const STORAGE_KEY = "nexus-lms-activity-feed"
/** Hard cap: oldest entries are dropped so storage stays small. */
const MAX_ACTIVITIES = 50
/**
 * Custom event fired after every addActivity(), so any open dashboard can
 * re-render immediately without knowing anything about the toast system.
 */
const EVENT_NAME = "nexus-lms-activity"

/**
 * How old the seed entries should be, in minutes from the moment they are
 * first created. This makes the sample data "age" consistently across
 * Reloads ("Just now" ... "26 hrs ago").
 */
const SEED_MINUTES = [2, 18, 60, 180, 26 * 60]

/**
 * Starter data so the feed isn't empty on the very first visit.
 * Only ever written when storage holds nothing yet.
 */
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

/**
 * Reads the feed from localStorage. Returns null when nothing is stored yet.
 *
 * SSR-safe (returns null when `window` is undefined) and never throws: on any
 * parse error it degrades to "no stored data" instead of crashing the page.
 */
function readStoredFeed(): ActivityItem[] | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    // Defensive: only accept entries that actually look like an ActivityItem,
    // so a hand-edited localStorage value can't break rendering.
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

/**
 * Returns the current feed. On the very first call (empty storage) the seed
 * entries are created and persisted once — seeding only happens when nothing
 * is stored, which is exactly what stops seeds from duplicating on reload.
 */
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

/**
 * Prepends a new activity, persists it and notifies all subscribers.
 * Called from the toast provider — see components/ui/toast.tsx.
 */
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
  // Notify the same tab (custom event) so open dashboards re-render live.
  window.dispatchEvent(new Event(EVENT_NAME))
}

/**
 * Subscription mechanism: the callback is invoked whenever the feed changes.
 * - Custom event -> same tab, fired by addActivity()
 * - "storage" event -> other tabs sharing the same localStorage
 * Returns a cleanup function (suited for useEffect).
 */
export function subscribeActivity(listener: () => void): () => void {
  window.addEventListener(EVENT_NAME, listener)
  window.addEventListener("storage", listener)
  return () => {
    window.removeEventListener(EVENT_NAME, listener)
    window.removeEventListener("storage", listener)
  }
}

/** Formats a timestamp as a relative label ("2 mins ago", "Yesterday"). */
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