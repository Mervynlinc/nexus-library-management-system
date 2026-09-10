"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Check, ChevronDown, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import type { Member } from "@/lib/members"

interface MemberSelectProps {
  members: Member[]
  value: string
  onChange: (memberId: string) => void
  error?: boolean
  disabled?: boolean
  id?: string
}

export function MemberSelect({
  members,
  value,
  onChange,
  error,
  disabled,
  id,
}: MemberSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = members.find((member) => member.id === value) ?? null

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return members
    return members.filter((member) =>
      `${member.firstName} ${member.lastName}`.toLowerCase().includes(needle)
    )
  }, [members, query])

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

  function selectMember(memberId: string) {
    onChange(memberId)
    setOpen(false)
    setQuery("")
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
          "flex h-11 w-full items-center justify-between gap-2 overflow-hidden rounded-[10px] border bg-surface px-4 text-left text-sm text-text-primary transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none",
          error ? "border-danger focus:border-danger pr-40" : "border-border focus:border-primary"
        )}
      >
        <span
          className={cn(
            "truncate",
            selected ? "text-text-primary" : "text-text-secondary"
          )}
        >
          {selected
            ? `${selected.firstName} ${selected.lastName}`
            : "Select a member"}
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
          <div className="relative border-b border-border">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-secondary" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setOpen(false)
                if (event.key === "Enter" && filtered[0]) {
                  selectMember(filtered[0].id)
                }
              }}
              placeholder="Search members"
              aria-label="Search members"
              className="h-11 w-full rounded-t-[10px] bg-bg pr-3 pl-9 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none"
            />
          </div>

          <ul role="listbox" className="max-h-56 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-text-secondary">
                No members match &quot;{query}&quot;.
              </li>
            ) : (
              filtered.map((member) => {
                const isSelected = member.id === value
                const fullName = `${member.firstName} ${member.lastName}`
                return (
                  <li key={member.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => selectMember(member.id)}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-[8px] px-3 py-2 text-left text-sm text-text-primary transition-colors duration-150 ease-out",
                        isSelected
                          ? "bg-primary-tint font-medium text-primary"
                          : "hover:bg-primary-tint/60"
                      )}
                    >
                      <span className="truncate">{fullName}</span>
                      {isSelected ? <Check className="size-4 shrink-0" /> : null}
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
