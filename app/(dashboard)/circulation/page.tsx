"use client"

import { useState } from "react"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"
import { DeleteLoanDialog } from "@/components/loans/delete-loan-dialog"
import { LoanFormDialog } from "@/components/loans/loan-form-dialog"
import { ReturnLoanDialog } from "@/components/loans/return-loan-dialog"
import {
  loanFromFormValues,
  type Loan,
  type LoanFormValues,
  type LoanStatus,
} from "@/lib/loans"
import { SEED_BOOKS } from "@/lib/mocks/books"
import { SEED_MEMBERS } from "@/lib/mocks/members"
import { SEED_LOANS } from "@/lib/mocks/loans-seed"

const PAGE_SIZE = 8

function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split("-")
  if (!year || !month || !day) return "\u2014"
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ]
  return `${Number(day)} ${months[Number(month) - 1] ?? ""} ${year}`
}

function StatusBadge({ status }: { status: LoanStatus }) {
  const config: Record<LoanStatus, { label: string; className: string }> = {
    active: {
      label: "Active",
      className: "bg-primary-tint text-primary",
    },
    returned: {
      label: "Returned",
      className: "bg-success-tint text-success",
    },
    overdue: {
      label: "Overdue",
      className: "bg-danger-tint text-danger",
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
            {totalItems === 1 ? "loan" : "loans"}
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

export default function CirculationPage() {
  const [loans, setLoans] = useState<Loan[]>(SEED_LOANS)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | LoanStatus>("all")
  const [formOpen, setFormOpen] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null)
  const [deletingLoan, setDeletingLoan] = useState<Loan | null>(null)
  const [returningLoan, setReturningLoan] = useState<Loan | null>(null)
  const toast = useToast()

  const query = search.trim().toLowerCase()

  function matchesSearch(loan: Loan): boolean {
    if (!query) return true
    const book = SEED_BOOKS.find((b) => b.id === loan.bookId)
    const member = SEED_MEMBERS.find((m) => m.id === loan.memberId)
    const bookTitle = book?.title ?? ""
    const memberName = member
      ? `${member.firstName} ${member.lastName}`
      : ""
    return `${bookTitle} ${memberName}`.toLowerCase().includes(query)
  }

  function matchesStatus(loan: Loan): boolean {
    if (statusFilter === "all") return true
    return loan.status === statusFilter
  }

  const filteredLoans = loans.filter(
    (loan) => matchesSearch(loan) && matchesStatus(loan)
  )

  const filtersActive = search.trim() !== "" || statusFilter !== "all"
  const totalPages = Math.max(1, Math.ceil(filteredLoans.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const visibleLoans = filteredLoans.slice(
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

  function openCreate() {
    setEditingLoan(null)
    setFormKey((key) => key + 1)
    setFormOpen(true)
  }

  function openEdit(loan: Loan) {
    setEditingLoan(loan)
    setFormKey((key) => key + 1)
    setFormOpen(true)
  }

  async function handleSubmit(values: LoanFormValues) {
    await new Promise((resolve) => setTimeout(resolve, 700))
    const now = new Date().toISOString()
    const fields = loanFromFormValues(values)

    setLoans((previous) => {
      if (editingLoan === null) {
        return [
          {
            id: crypto.randomUUID(),
            ...fields,
            createdAt: now,
            updatedAt: now,
          },
          ...previous,
        ]
      }
      return previous.map((loan) =>
        loan.id === editingLoan.id
          ? { ...loan, ...fields, updatedAt: now }
          : loan
      )
    })
    setFormOpen(false)
    toast({
      variant: "success",
      title: editingLoan === null ? "Loan created" : "Loan updated",
      description:
        editingLoan === null
          ? "The loan record has been created."
          : "The loan record has been updated.",
    })
  }

  function handleReturn(returnDate: string) {
    if (returningLoan === null) return
    const now = new Date().toISOString()
    setLoans((previous) =>
      previous.map((loan) =>
        loan.id === returningLoan.id
          ? { ...loan, returnDate, status: "returned" as const, updatedAt: now }
          : loan
      )
    )
    setReturningLoan(null)
    toast({
      variant: "success",
      title: "Book returned",
      description: "The return date has been recorded.",
    })
  }

  function handleDelete() {
    if (deletingLoan === null) return
    setLoans((previous) =>
      previous.filter((loan) => loan.id !== deletingLoan.id)
    )
    setDeletingLoan(null)
    toast({
      variant: "success",
      title: "Loan record deleted",
      description: "The loan record has been permanently removed.",
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">
            Loans
          </h1>
          <p className="text-sm text-text-secondary">
            Process loans and returns, enforce due dates, and guard against a
            copy being loaned to two patrons at once.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus />
          New loan
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:max-w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-secondary" />
          <Input
            value={search}
            onChange={(event) => updateSearch(event.target.value)}
            placeholder="Search by book or member"
            aria-label="Search loans"
            className="h-11 rounded-[10px] border-border bg-surface pl-9"
          />
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as "all" | LoanStatus)
                setPage(1)
              }}
              aria-label="Filter by status"
              className="h-11 appearance-none rounded-[10px] border border-border bg-surface pr-9 pl-3 text-sm text-text-primary focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-hidden"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="returned">Returned</option>
              <option value="overdue">Overdue</option>
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
              <th className="w-[25%] px-5 py-3 text-left text-[12px] font-medium text-text-secondary">
                Book
              </th>
              <th className="w-[13%] px-4 py-3 text-left text-[12px] font-medium text-text-secondary">
                Issue date
              </th>
              <th className="w-[13%] px-4 py-3 text-left text-[12px] font-medium text-text-secondary">
                Due date
              </th>
              <th className="w-[13%] px-4 py-3 text-left text-[12px] font-medium text-text-secondary">
                Return date
              </th>
              <th className="w-[10%] px-4 py-3 text-left text-[12px] font-medium text-text-secondary">
                Status
              </th>
              <th className="w-28 px-5 py-3 text-right text-[12px] font-medium text-text-secondary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loans.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-12 text-center text-sm text-text-secondary"
                >
                  No loans yet. Click &quot;New loan&quot; to issue the first
                  copy.
                </td>
              </tr>
            ) : filteredLoans.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-12 text-center text-sm text-text-secondary"
                >
                  No loans match your search or filters.
                </td>
              </tr>
            ) : (
              visibleLoans.map((loan) => {
                const book = SEED_BOOKS.find((b) => b.id === loan.bookId)
                const member = SEED_MEMBERS.find(
                  (m) => m.id === loan.memberId
                )

                return (
                  <tr
                    key={loan.id}
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
                      {formatDate(loan.issueDate)}
                    </td>
                    <td className="px-4 py-3 text-text-secondary tabular-nums">
                      {formatDate(loan.dueDate)}
                    </td>
                    <td className="px-4 py-3 text-text-secondary tabular-nums">
                      {loan.returnDate
                        ? formatDate(loan.returnDate)
                        : "\u2014"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={loan.status} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        {loan.status !== "returned" ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setReturningLoan(loan)}
                            aria-label="Return book"
                            title="Return book"
                            className="text-text-secondary hover:text-success"
                          >
                            <RotateCcw />
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(loan)}
                          aria-label="Edit loan"
                          className="text-text-secondary hover:text-primary"
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingLoan(loan)}
                          aria-label="Delete loan"
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
        totalItems={filteredLoans.length}
        onPageChange={setPage}
      />

      <LoanFormDialog
        key={formKey}
        open={formOpen}
        loan={editingLoan}
        books={SEED_BOOKS}
        members={SEED_MEMBERS}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
      />
      <ReturnLoanDialog
        loan={returningLoan}
        books={SEED_BOOKS}
        members={SEED_MEMBERS}
        onOpenChange={(open) => {
          if (!open) setReturningLoan(null)
        }}
        onConfirm={handleReturn}
      />
      <DeleteLoanDialog
        loan={deletingLoan}
        books={SEED_BOOKS}
        members={SEED_MEMBERS}
        onOpenChange={(open) => {
          if (!open) setDeletingLoan(null)
        }}
        onConfirm={handleDelete}
      />
    </div>
  )
}
