"use client"

import { useId, useState, type FormEvent } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/toast"
import { Field } from "@/components/form/field"
import { BookSelect } from "@/components/loans/book-select"
import { MemberSelect } from "@/components/loans/member-select"
import {
  loanToFormValues,
  cleanLoanFormValues,
  isLoanFormValid,
  validateLoan,
  type Loan,
  type LoanFormErrors,
  type LoanFormValues,
} from "@/lib/loans"
import type { Book } from "@/lib/books"
import type { Member } from "@/lib/members"
import type { MembershipPlan } from "@/lib/membership-plans"

/**
 * LoanFormDialog — create/edit dialog for loans.
 *
 * Used by the Circulation page (new + edit) and the Books page ("Lend").
 * The page passes live data via props (`books`, `members`, `loans`, `plans`);
 * `defaultBookId` pre-selects the book when lending starts from a book card.
 */
interface LoanFormDialogProps {
  open: boolean
  loan: Loan | null // null -> creating a new loan; otherwise editing
  books: Book[]
  members: Member[]
  loans: Loan[]
  plans: MembershipPlan[]
  defaultBookId?: string
  onOpenChange: (open: boolean) => void
  onSubmit: (values: LoanFormValues) => Promise<void> | void
}

export function LoanFormDialog({
  open,
  loan,
  books,
  members,
  loans,
  plans,
  defaultBookId,
  onOpenChange,
  onSubmit,
}: LoanFormDialogProps) {
  const editing = loan !== null
  const uid = useId()
  const toast = useToast()

  const [values, setValues] = useState<LoanFormValues>(() => {
    // Seed form state from the loan being edited, or from defaults (today).
    const base = loanToFormValues(loan)
    if (!loan && defaultBookId) {
      return { ...base, bookId: defaultBookId }
    }
    return base
  })
  const [errors, setErrors] = useState<LoanFormErrors>({})
  const [isSaving, setIsSaving] = useState(false)

  // Small controlled-input helper: update one field of `values`.
  function update<const K extends keyof LoanFormValues>(
    field: K,
    value: LoanFormValues[K]
  ) {
    setValues((previous) => ({ ...previous, [field]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (isSaving) return // guard against double submits while saving

    // Guard: a returned loan is a closed record and must not be edited.
    if (loan?.status === "returned") {
      toast({
        variant: "error",
        title: "Loan already returned",
        description: "Returned loans can't be edited.",
      })
      return
    }

    // Validate on a cleaned copy, using the live context passed by the page.
    // All business rules (free copy, borrowing limit) live in validateLoan.
    const cleaned = cleanLoanFormValues(values)
    const nextErrors = validateLoan(cleaned, {
      books,
      members,
      loans,
      plans,
      editingId: loan?.id,
    })
    setErrors(nextErrors)
    if (!isLoanFormValid(nextErrors)) {
      toast({
        variant: "error",
        title: "Couldn't save the loan",
        description: "Fix the highlighted fields and try again.",
      })
      return
    }

    setIsSaving(true)
    try {
      // Delegate persistence to the page: it owns loans/books state.
      await onSubmit(cleaned)
    } catch {
      toast({
        variant: "error",
        title: "Couldn't save the loan",
        description: "Something went wrong. Please try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit loan" : "New loan"}
          </DialogTitle>
          {editing ? (
            <DialogDescription>
              Update the loan record. Created and updated timestamps are
              maintained automatically.
            </DialogDescription>
          ) : (
            <DialogDescription>
              Issue a book copy to a member. Set a due date for the expected
              return.
            </DialogDescription>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Book"
                htmlFor={`${uid}-bookId`}
                error={errors.bookId}
              >
                <BookSelect
                  id={`${uid}-bookId`}
                  books={books}
                  value={values.bookId}
                  onChange={(bookId) => update("bookId", bookId)}
                  disabled={isSaving}
                  error={Boolean(errors.bookId)}
                />
              </Field>

              <Field
                label="Member"
                htmlFor={`${uid}-memberId`}
                error={errors.memberId}
              >
                <MemberSelect
                  id={`${uid}-memberId`}
                  members={members}
                  value={values.memberId}
                  onChange={(memberId) => update("memberId", memberId)}
                  disabled={isSaving}
                  error={Boolean(errors.memberId)}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Issue date"
                htmlFor={`${uid}-issueDate`}
                error={errors.issueDate}
              >
                <Input
                  id={`${uid}-issueDate`}
                  type="date"
                  value={values.issueDate}
                  onChange={(event) => update("issueDate", event.target.value)}
                  disabled={isSaving}
                  aria-invalid={Boolean(errors.issueDate)}
                  className={cn(
                    "h-11 rounded-[10px] bg-surface",
                    errors.issueDate && "pr-44"
                  )}
                />
              </Field>

              <Field
                label="Due date"
                htmlFor={`${uid}-dueDate`}
                error={errors.dueDate}
              >
                <Input
                  id={`${uid}-dueDate`}
                  type="date"
                  value={values.dueDate}
                  onChange={(event) => update("dueDate", event.target.value)}
                  disabled={isSaving}
                  aria-invalid={Boolean(errors.dueDate)}
                  className={cn(
                    "h-11 rounded-[10px] bg-surface",
                    errors.dueDate && "pr-44"
                  )}
                />
              </Field>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin" /> : null}
              {isSaving
                ? "Saving\u2026"
                : editing
                  ? "Save changes"
                  : "Create loan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
