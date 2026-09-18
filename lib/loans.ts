import type { Book } from "@/lib/books"
import type { Member } from "@/lib/members"
import type { MembershipPlan } from "@/lib/membership-plans"

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

export interface LoanFormValues {
  bookId: string
  memberId: string
  issueDate: string
  dueDate: string
}

export type LoanFormErrors = Partial<Record<keyof LoanFormValues, string>>

export interface LoanValidationContext {
  books: Book[]
  members: Member[]
  loans: Loan[]
  plans: MembershipPlan[]
  editingId?: string
}

export function cleanLoanFormValues(values: LoanFormValues): LoanFormValues {
  return {
    bookId: values.bookId.trim(),
    memberId: values.memberId.trim(),
    issueDate: values.issueDate.trim(),
    dueDate: values.dueDate.trim(),
  }
}

export function loanToFormValues(loan: Loan | null): LoanFormValues {
  if (!loan) {
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

export function isLoanFormValid(errors: LoanFormErrors) {
  return Object.keys(errors).length === 0
}
