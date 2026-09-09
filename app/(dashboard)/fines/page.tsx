"use client"

import { useState } from "react"
import {
  BadgeCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"
import { DeleteFineDialog } from "@/components/fines/delete-fine-dialog"
import { MarkPaidDialog } from "@/components/fines/mark-paid-dialog"
import {
  DAILY_FINE_RATE,
  formatUGX,
  type Fine,
  type FineStatus,
} from "@/lib/fines"
import { SEED_BOOKS } from "@/lib/mocks/books"
import { SEED_FINES } from "@/lib/mocks/fines-seed"
import { SEED_MEMBERS } from "@/lib/mocks/members"

const PAGE_SIZE = 8

function StatusBadge({ status }: { status: FineStatus }) {
  const config: Record<FineStatus, { label: string; className: string }> = {
    outstanding: {
      label: "Outstanding",
      className: "bg-danger-tint text-danger",
    },
    paid: {
      label: "Paid",
      className: "bg-success-tint text-success",
    },
  }
  const { label, className } = config[status]
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  )
}

function Pagination({
  page,
  totalItems,
  onPageChange,
}: {
  page: number
  totalItems: number
  onPageChange: (page: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
  const start = totalItems === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const end = Math.min(page * PAGE_SIZE, totalItems)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-text-secondary">
        {totalItems === 0 ? (
          "No entries to show."
        ) : (
          <>
            Showing <span className="font-medium text-text-primary">{start}</span>–
            <span className="font-medium text-text-primary">{end}</span> of{" "}
            <span className="font-medium text-text-primary">{totalItems}</span>{" "}
            {totalItems === 1 ? "fine" : "fines"}
          </>
        )}
      </p>
      {totalPages > 1 ? (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft />
          </Button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (number) => (
              <Button
                key={number}
                size="icon"
                variant={number === page ? "default" : "outline"}
                onClick={() => onPageChange(number)}
                aria-label={`Go to page ${number}`}
                aria-current={number === page ? "page" : undefined}
              >
                {number}
              </Button>
            )
          )}
          <Button
            variant="outline"
            size="icon"
            disabled={page === totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            <ChevronRight />
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export default function FinesPage() {
  const [fines, setFines] = useState<Fine[]>(SEED_FINES)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | FineStatus>("all")
  const [markingPaid, setMarkingPaid] = useState<Fine | null>(null)
  const [deletingFine, setDeletingFine] = useState<Fine | null>(null)
  const toast = useToast()

  const query = search.trim().toLowerCase()

  function matchesSearch(fine: Fine): boolean {
    if (!query) return true
    const book = SEED_BOOKS.find((b) => b.id === fine.bookId)
    const member = SEED_MEMBERS.find((m) => m.id === fine.memberId)
    const bookTitle = book?.title ?? ""
    const memberName = member
      ? `${member.firstName} ${member.lastName}`
      : ""
    return `${bookTitle} ${memberName}`.toLowerCase().includes(query)
  }

  function matchesStatus(fine: Fine): boolean {
    if (statusFilter === "all") return true
    return fine.status === statusFilter
  }

  const filteredFines = fines.filter(
    (fine) => matchesSearch(fine) && matchesStatus(fine)
  )

  const filtersActive = search.trim() !== "" || statusFilter !== "all"
  const totalPages = Math.max(1, Math.ceil(filteredFines.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const visibleFines = filteredFines.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  function updateSearch(value: string) {
    setSearch(value)
    setPage(1)
  }

  function resetFilters() {
    setSearch("")
    setStatusFilter("all")
    setPage(1)
  }

  function handleMarkPaid() {
    if (markingPaid === null) return
    const now = new Date().toISOString()
    setFines((previous) =>
      previous.map((fine) =>
        fine.id === markingPaid.id
          ? { ...fine, status: "paid", updatedAt: now }
          : fine
      )
    )
    setMarkingPaid(null)
    toast({
      variant: "success",
      title: "Fine marked as paid",
      description: "The payment has been recorded.",
    })
  }

  function handleDelete() {
    if (deletingFine === null) return
    setFines((previous) =>
      previous.filter((fine) => fine.id !== deletingFine.id)
    )
    setDeletingFine(null)
    toast({
      variant: "success",
      title: "Fine record deleted",
      description: "The fine record has been permanently removed.",
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">
            Fines / Penalties
          </h1>
          <p className="text-sm text-text-secondary">
            Fines are created automatically when a loan becomes overdue — there
            is no manual entry. Amounts accrue at {formatUGX(DAILY_FINE_RATE)}{" "}
            per day from the due date.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:max-w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-secondary" />
          <Input
            value={search}
            onChange={(event) => updateSearch(event.target.value)}
            placeholder="Search by book or member"
            aria-label="Search fines"
            className="h-11 rounded-[10px] border-border bg-surface pl-9"
          />
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as "all" | FineStatus)
                setPage(1)
              }}
              aria-label="Filter by status"
              className="h-11 appearance-none rounded-[10px] border border-border bg-surface pr-9 pl-3 text-sm text-text-primary focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-hidden"
            >
              <option value="all">All statuses</option>
              <option value="outstanding">Outstanding</option>
              <option value="paid">Paid</option>
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-text-secondary" />
          </div>
          {filtersActive ? (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Reset
            </Button>
          ) : null}
        </div>
      </div>

      <div className="bg-surface overflow-hidden rounded-[14px] border border-border">
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="w-[18%] px-4 py-3 text-left text-[12px] font-medium text-text-secondary">
                Member
              </th>
              <th className="w-[32%] px-5 py-3 text-left text-[12px] font-medium text-text-secondary">
                Book
              </th>
              <th className="w-[14%] px-4 py-3 text-left text-[12px] font-medium text-text-secondary">
                Days overdue
              </th>
              <th className="w-[16%] px-4 py-3 text-left text-[12px] font-medium text-text-secondary">
                Amount
              </th>
              <th className="w-[12%] px-4 py-3 text-left text-[12px] font-medium text-text-secondary">
                Status
              </th>
              <th className="w-28 px-5 py-3 text-right text-[12px] font-medium text-text-secondary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {fines.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-12 text-center text-sm text-text-secondary"
                >
                  No fines yet. Overdue loans are moved here automatically.
                </td>
              </tr>
            ) : filteredFines.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-12 text-center text-sm text-text-secondary"
                >
                  No fines match your search or filters.
                </td>
              </tr>
            ) : (
              visibleFines.map((fine) => {
                const book = SEED_BOOKS.find((b) => b.id === fine.bookId)
                const member = SEED_MEMBERS.find(
                  (m) => m.id === fine.memberId
                )

                return (
                  <tr
                    key={fine.id}
                    className="transition-colors duration-150 hover:bg-muted/50"
                  >
                    <td className="truncate px-4 py-3 font-semibold text-text-primary">
                      {member
                        ? `${member.firstName} ${member.lastName}`
                        : "Unknown"}
                    </td>
                    <td className="truncate px-5 py-3 text-text-secondary">
                      {book?.title ?? "Unknown book"}
                    </td>
                    <td className="px-4 py-3 text-text-secondary tabular-nums">
                      {fine.daysOverdue}{" "}
                      {fine.daysOverdue === 1 ? "day" : "days"}
                    </td>
                    <td className="px-4 py-3 font-medium text-text-primary tabular-nums">
                      {formatUGX(fine.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={fine.status} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        {fine.status !== "paid" ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setMarkingPaid(fine)}
                            aria-label="Mark fine as paid"
                            title="Mark as paid"
                            className="text-text-secondary hover:text-success"
                          >
                            <BadgeCheck />
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingFine(fine)}
                          aria-label="Delete fine record"
                          className="text-text-secondary hover:bg-danger-tint hover:text-danger"
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={currentPage}
        totalItems={filteredFines.length}
        onPageChange={setPage}
      />

      <MarkPaidDialog
        fine={markingPaid}
        books={SEED_BOOKS}
        members={SEED_MEMBERS}
        onOpenChange={(open) => {
          if (!open) setMarkingPaid(null)
        }}
        onConfirm={handleMarkPaid}
      />
      <DeleteFineDialog
        fine={deletingFine}
        books={SEED_BOOKS}
        members={SEED_MEMBERS}
        onOpenChange={(open) => {
          if (!open) setDeletingFine(null)
        }}
        onConfirm={handleDelete}
      />
    </div>
  )
}