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

const TOAST_DURATION = 4200
const LEAVE_DURATION = 220

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(1)

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
      const id = nextId.current
      nextId.current += 1
      setToasts((previous) => [{ ...action, id, leaving: false }, ...previous])
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