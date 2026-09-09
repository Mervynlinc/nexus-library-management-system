import type { Loan } from "@/lib/loans"
import { formatUGX } from "@/lib/utils"

export { formatUGX }

export type FineStatus = "outstanding" | "paid"

export interface Fine {
  id: string
  loanId: string
  bookId: string
  memberId: string
  dueDate: string
  daysOverdue: number
  amount: number
  status: FineStatus
  createdAt: string
  updatedAt: string
}

export const DAILY_FINE_RATE = 20

const DAY_MS = 86_400_000

export function daysOverdue(dueDate: string, fromIso?: string): number {
  const due = new Date(`${dueDate}T00:00:00.000Z`)
  const now = new Date(fromIso ?? new Date().toISOString())
  if (Number.isNaN(due.getTime()) || Number.isNaN(now.getTime())) return 0
  return Math.max(0, Math.floor((now.getTime() - due.getTime()) / DAY_MS))
}

export function computeFineAmount(overdueDays: number): number {
  return overdueDays * DAILY_FINE_RATE
}

export function fineFromOverdueLoan(
  loan: Loan,
  index: number,
  nowIso?: string
): Fine {
  const now = nowIso ?? new Date().toISOString()
  const overdueDays = daysOverdue(loan.dueDate, now)
  return {
    id: `fine-${String(index + 1).padStart(3, "0")}`,
    loanId: loan.id,
    bookId: loan.bookId,
    memberId: loan.memberId,
    dueDate: loan.dueDate,
    daysOverdue: overdueDays,
    amount: computeFineAmount(overdueDays),
    status: "outstanding",
    createdAt: now,
    updatedAt: now,
  }
}

export function finesFromOverdueLoans(
  loans: Loan[],
  nowIso?: string
): Fine[] {
  return loans
    .filter((loan) => loan.status === "overdue")
    .map((loan, index) => fineFromOverdueLoan(loan, index, nowIso))
}