"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Check, ChevronDown, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { normalizeIsbn, type Book } from "@/lib/books"

interface BookSelectProps {
  books: Book[]
  value: string
  onChange: (bookId: string) => void
  error?: boolean
  disabled?: boolean
  id?: string
}

export function BookSelect({
  books,
  value,
  onChange,
  error,
  disabled,
  id,
}: BookSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = books.find((book) => book.id === value) ?? null

  // Filter books client-side. Matches by title OR ISBN. normalizeIsbn() strips
  // hyphens/spaces and uppercases, so "978-0-13-235088-4", "9780132350884" or a
  // partial "235088" all match the same book.
  const filtered = useMemo(() => {
    const needle = query.trim()
    if (!needle) return books
    const needleLower = needle.toLowerCase()
    const isbnNeedle = normalizeIsbn(needle)
    return books.filter(
      (book) =>
        book.title.toLowerCase().includes(needleLower) ||
        (isbnNeedle.length > 0 && normalizeIsbn(book.isbn).includes(isbnNeedle))
    )
  }, [books, query])

  // Close the dropdown when the user clicks anywhere outside the component.
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

  function selectBook(bookId: string) {
    onChange(bookId)
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
          {selected ? selected.title : "Select a book"}
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
                  selectBook(filtered[0].id)
                }
              }}
              placeholder="Search books"
              aria-label="Search books"
              className="h-11 w-full rounded-t-[10px] bg-bg pr-3 pl-9 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none"
            />
          </div>

          <ul role="listbox" className="max-h-56 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-text-secondary">
                No books match &quot;{query}&quot;.
              </li>
            ) : (
              filtered.map((book) => {
                const isSelected = book.id === value
                return (
                  <li key={book.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => selectBook(book.id)}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-[8px] px-3 py-2 text-left text-sm text-text-primary transition-colors duration-150 ease-out",
                        isSelected
                          ? "bg-primary-tint font-medium text-primary"
                          : "hover:bg-primary-tint/60"
                      )}
                    >
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate">{book.title}</span>
                        {/* Show the ISBN under the title so users can pick by it. */}
                        <span className="truncate text-xs text-text-secondary">
                          {book.isbn}
                        </span>
                      </span>
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
