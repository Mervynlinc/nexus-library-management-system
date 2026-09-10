"use client"

import { useEffect, useRef, useState } from "react"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import type { MembershipPlan } from "@/lib/members"

interface MembershipSelectProps {
  plans: MembershipPlan[]
  value: string
  onChange: (planId: string) => void
  error?: boolean
  disabled?: boolean
  id?: string
}

export function MembershipSelect({
  plans,
  value,
  onChange,
  error,
  disabled,
  id,
}: MembershipSelectProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = plans.find((plan) => plan.id === value) ?? null

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [])

  function selectPlan(planId: string) {
    onChange(planId)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((previous) => !previous)}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-[10px] border bg-surface px-4 text-left text-sm text-text-primary transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none",
          error ? "border-danger focus:border-danger pr-40" : "border-border focus:border-primary"
        )}
      >
        <span
          className={cn(
            "truncate",
            selected ? "text-text-primary" : "text-text-secondary"
          )}
        >
          {selected ? selected.name : "Select membership plan"}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-text-secondary transition-transform duration-150",
            open && "rotate-180"
          )}
        />
      </button>

      {open ? (
        <div className="bg-surface z-20 absolute mt-1 w-full overflow-hidden rounded-[10px] border border-border shadow-card">
          <ul role="listbox" className="max-h-56 overflow-y-auto p-1">
            {plans.map((plan) => {
              const isSelected = plan.id === value
              return (
                <li key={plan.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => selectPlan(plan.id)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-[8px] px-3 py-2 text-left text-sm text-text-primary transition-colors duration-150 ease-out",
                      isSelected
                        ? "bg-primary-tint font-medium text-primary"
                        : "hover:bg-primary-tint/60"
                    )}
                  >
                    <span className="truncate">{plan.name}</span>
                    {isSelected ? <Check className="size-4 shrink-0" /> : null}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </div>
  )
}