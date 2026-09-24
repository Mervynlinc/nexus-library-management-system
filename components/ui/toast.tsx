"use client"

import * as React from "react"
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { CircleAlert, CircleCheck, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { addActivity } from "@/lib/activity"

/**
 * Toast system.
 *
 * ToastProvider wraps the whole app (see app/layout.tsx). Every success/error
 * banner in the app is raised through `show` from useToast(). That single
 * entry point makes the toast the perfect chokepoint for activity logging:
 * every toast either succeeds or fails an action, so "toast fired" ==
 * "something happened worth recording". We piggyback on it to keep the
 * dashboard activity feed + chart in sync (addActivity below).
 */

export type ToastVariant = "success" | "error"

export interface ToastAction {
  variant: ToastVariant
  title: string
  description?: string
}

interface ToastItem extends ToastAction {
  id: number
  leaving: boolean
}

const ToastContext = createContext<(action: ToastAction) => void>(() => {})

/** How long a toast stays visible before it starts to fade out. */
const TOAST_DURATION = 4200
/** How long the exit animation runs before the toast is removed from state. */
const LEAVE_DURATION = 220

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  // Monotonic id counter (useRef) — stable keys for React's list rendering.
  const nextId = useRef(1)

  // Marks a toast as "leaving", then removes it once the exit animation ends.
  const dismiss = useCallback((id: number) => {
    setToasts((previous) =>
      previous.map((toast) =>
        toast.id === id ? { ...toast, leaving: true } : toast
      )
    )
    window.setTimeout(() => {
      setToasts((previous) => previous.filter((toast) => toast.id !== id))
    }, LEAVE_DURATION)
  }, [])

  const show = useCallback(
    (action: ToastAction) => {
      // 1) Log to the persistent activity feed (dashboard feed + chart).
      addActivity(action)
      // 2) Show the visual toast, newest first.
      const id = nextId.current
      nextId.current += 1
      setToasts((previous) => [{ ...action, id, leaving: false }, ...previous])
      // 3) Auto-dismiss after the duration.
      window.setTimeout(() => dismiss(id), TOAST_DURATION)
    },
    [dismiss]
  )

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed top-4 right-4 z-[60] flex w-full max-w-sm flex-col items-end gap-2 px-4"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.variant === "error" ? "alert" : "status"}
            className={cn(
              "bg-surface pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[12px] border border-border p-3.5 shadow-[0_20px_40px_rgba(20,24,40,0.10)]",
              toast.leaving ? "toast-leave" : "toast-enter"
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
                toast.variant === "success"
                  ? "bg-success-tint text-success"
                  : "bg-danger-tint text-danger"
              )}
            >
              {toast.variant === "success" ? (
                <CircleCheck className="size-3.5" />
              ) : (
                <CircleAlert className="size-3.5" />
              )}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 pr-1">
              <p className="text-[13px] font-medium text-text-primary">
                {toast.title}
              </p>
              {toast.description ? (
                <p className="text-xs text-text-secondary">
                  {toast.description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="text-text-secondary shrink-0 rounded-md p-1 transition-colors hover:bg-muted hover:text-text-primary"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}