import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface FieldProps {
  label: string
  htmlFor?: string
  error?: string
  position?: string
  children: ReactNode
}

export function Field({
  label,
  htmlFor,
  error,
  position = "right-0",
  children,
}: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-[13px] font-medium text-text-secondary"
      >
        {label}
      </label>
      <div className="relative">
        {children}
        {error ? (
          <div
            role="alert"
            className={cn(
              "pointer-events-none absolute inset-y-0 flex items-center gap-1.5 overflow-hidden pr-3",
              position
            )}
          >
            <span
              aria-hidden="true"
              className="alert-circle flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-danger"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M12 7v6m0 4h.01"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="whitespace-nowrap text-xs font-medium text-danger">
              {error}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  )
}