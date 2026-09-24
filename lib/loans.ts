import type { Book } from "@/lib/books"
import type { Member } from "@/lib/members"
import type { MembershipPlan } from "@/lib/membership-plans"

/**
 * Loan domain types + validation.
 *
 * A loan links a book and a member for a date range (issue -> due date) and
 * can be active, returned or overdue. This file is shared by the circulation
 * page and the books page's "Lend" dialog, so the exact same edit/create rules
 * apply in both places (single source of truth for the rules).
 */

export type LoanStatus = "active" | "returned" | "overdue"

export interface Loan {
  id: string
  bookId: string
  memberId: string
  issueDate: string
  dueDate: string
  returnDate: string | null
  status: LoanStatus
  createdAt: string
  updatedAt: string
}

/** Raw submitted form shape (book/member are ids referencing other mocks). */
export interface LoanFormValues {
  bookId: string
  memberId: string
  issueDate: string
  dueDate: string
}

export type LoanFormErrors = Partial<Record<keyof LoanFormValues, string>>

/**
 * Everything validateLoan needs to enforce business rules. Passed in from the
 * page that opens the dialog so validation always looks at live in-memory data
 * (`loans`/`books`/...) rather than stale copies. `editingId` is the loan being
 * edited, so its own open records are excluded from the counts.
 */
export interface LoanValidationContext {
  books: Book[]
  members: Member[]
  loans: Loan[]
  plans: MembershipPlan[]
  editingId?: string
}

/**
 * Trims every input before validation. Always validate the *cleaned* values so
 * padding spaces can't pass an empty-field check or mess up date parsing.
 */
export function cleanLoanFormValues(values: LoanFormValues): LoanFormValues {
  return {
    bookId: values.bookId.trim(),
    memberId: values.memberId.trim(),
    issueDate: values.issueDate.trim(),
    dueDate: values.dueDate.trim(),
  }
}

/** Builds seed-form values for the dialog: blank new loan or an existing one. */
export function loanToFormValues(loan: Loan | null): LoanFormValues {
  if (!loan) {
    // Sensible default: issue date = today, due date left for the user.
    const today = new Date().toISOString().slice(0, 10)
    return {
      bookId: "",
      memberId: "",
      issueDate: today,
      dueDate: "",
    }
  }

  return {
    bookId: loan.bookId,
    memberId: loan.memberId,
    issueDate: loan.issueDate,
    dueDate: loan.dueDate,
  }
}

/**
 * Maps already-validated form values onto the Loan fields that come from the
 * form. A brand-new loan is always active with no return date yet.
 */
export function loanFromFormValues(
  values: LoanFormValues
): Pick<Loan, "bookId" | "memberId" | "issueDate" | "dueDate" | "returnDate" | "status"> {
  return {
    bookId: values.bookId,
    memberId: values.memberId,
    issueDate: values.issueDate,
    dueDate: values.dueDate,
    returnDate: null,
    status: "active",
  }
}

/**
 * Validates a loan form and returns an errors object (empty == valid).
 *
 * Part 1 — field-level checks: required + real dates + due date after issue.
 * Part 2 — business rules (only when a context is supplied):
 *   - the book must exist and have at least one free copy
 *   - the member must exist, have a valid plan, and not exceed that plan's
 *     borrowing limit (open loans + this new one <= limit)
 *
 * "Open" means status !== "returned"; editingId is ignored so editing (not
 * creating) a loan doesn't double-count its own outstanding entry.
 */
export function validateLoan(
  values: LoanFormValues,
  ctx?: LoanValidationContext
): LoanFormErrors {
  const errors: LoanFormErrors = {}

  if (!values.bookId) {
    errors.bookId = "Select a book."
  }

  if (!values.memberId) {
    errors.memberId = "Select a member."
  }

  if (!values.issueDate) {
    errors.issueDate = "Issue date is required."
  } else {
    const parsed = new Date(`${values.issueDate}T00:00:00.000Z`)
    if (Number.isNaN(parsed.getTime())) {
      errors.issueDate = "Enter a valid date."
    } else if (parsed.getTime() > Date.now()) {
      errors.issueDate = "Issue date can't be in the future."
    }
  }

  if (!values.dueDate) {
    errors.dueDate = "Due date is required."
  } else {
    const parsed = new Date(`${values.dueDate}T00:00:00.000Z`)
    if (Number.isNaN(parsed.getTime())) {
      errors.dueDate = "Enter a valid date."
    } else if (values.issueDate) {
      const issue = new Date(`${values.issueDate}T00:00:00.000Z`)
      if (
        !Number.isNaN(issue.getTime()) &&
        parsed.getTime() <= issue.getTime()
      ) {
        errors.dueDate = "Due date must be after the issue date."
      }
    }
  }

  if (ctx) {
    const editingId = ctx.editingId

    // --- Business rule: the book must exist and have a free copy. ---
    // "outstanding" = how many open loans already reference this book; a
    // physical copy can only be loaned once, so we cap it at availableCopies.
    if (values.bookId) {
      const book = ctx.books.find((b) => b.id === values.bookId)
      if (!book) {
        errors.bookId = "Select a valid book."
      } else {
        const outstandingForBook = ctx.loans.filter(
          (loan) =>
            loan.bookId === book.id &&
            loan.status !== "returned" &&
            loan.id !== editingId
        ).length
        if (outstandingForBook >= book.availableCopies) {
          errors.bookId = "No copies of this book are available."
        }
      }
    }

    // --- Business rule: member exists, has a valid plan, and hasn't hit ---
    // --- the borrowing limit. Adding this loan must keep them at or under it. ---
    if (values.memberId) {
      const member = ctx.members.find((m) => m.id === values.memberId)
      if (!member) {
        errors.memberId = "Select a valid member."
      } else {
        const plan = ctx.plans.find((p) => p.id === member.membershipId)
        if (!plan) {
          errors.memberId = "Member's membership plan is invalid."
        } else {
          const outstandingForMember = ctx.loans.filter(
            (loan) =>
              loan.memberId === member.id &&
              loan.status !== "returned" &&
              loan.id !== editingId
          ).length
          if (outstandingForMember + 1 > plan.borrowingLimit) {
            errors.memberId = `${member.firstName} ${member.lastName} has reached the borrowing limit of ${plan.borrowingLimit} book${plan.borrowingLimit === 1 ? "" : "s"}.`
          }
        }
      }
    }
  }

  return errors
}

/** Convenience check so callers can test validity in one line. */
export function isLoanFormValid(errors: LoanFormErrors) {
  return Object.keys(errors).length === 0
}
