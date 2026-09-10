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

export function cleanText(value: string): string {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
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

export function validateLoan(values: LoanFormValues): LoanFormErrors {
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

  return errors
}

export function isLoanFormValid(errors: LoanFormErrors) {
  return Object.keys(errors).length === 0
}
