"use client"

import { useId, useState, type FormEvent } from "react"
import { ChevronDown, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import {
  BILLING_TERM_OPTIONS,
  cleanMembershipPlanFormValues,
  findDuplicateMembershipPlan,
  isMembershipPlanFormValid,
  membershipPlanToFormValues,
  validateMembershipPlan,
  type MembershipPlan,
  type MembershipPlanFormErrors,
  type MembershipPlanFormValues,
} from "@/lib/membership-plans"

interface MembershipPlanFormDialogProps {
  open: boolean
  plan: MembershipPlan | null
  plans: MembershipPlan[]
  onOpenChange: (open: boolean) => void
  onSubmit: (values: MembershipPlanFormValues) => Promise<void> | void
}

export function MembershipPlanFormDialog({
  open,
  plan,
  plans,
  onOpenChange,
  onSubmit,
}: MembershipPlanFormDialogProps) {
  const editing = plan !== null
  const uid = useId()
  const toast = useToast()

  const [values, setValues] = useState<MembershipPlanFormValues>(() =>
    membershipPlanToFormValues(plan)
  )
  const [errors, setErrors] = useState<MembershipPlanFormErrors>({})
  const [isSaving, setIsSaving] = useState(false)

  function update<const K extends keyof MembershipPlanFormValues>(
    field: K,
    value: MembershipPlanFormValues[K]
  ) {
    setValues((previous) => ({ ...previous, [field]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (isSaving) return

    const cleaned = cleanMembershipPlanFormValues(values)
    const nextErrors = validateMembershipPlan(cleaned)
    if (!nextErrors.name) {
      const duplicate = findDuplicateMembershipPlan(
        plans,
        cleaned.name,
        plan?.id
      )
      if (duplicate) {
        nextErrors.name = "A plan with this name already exists."
      }
    }
    setErrors(nextErrors)
    if (!isMembershipPlanFormValid(nextErrors)) {
      toast({
        variant: "error",
        title: "Couldn't save the plan",
        description: "Fix the highlighted fields and try again.",
      })
      return
    }

    setIsSaving(true)
    try {
      await onSubmit(cleaned)
    } catch {
      toast({
        variant: "error",
        title: "Couldn't save the plan",
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
            {editing ? "Edit membership plan" : "Add new membership plan"}
          </DialogTitle>
          {editing ? (
            <DialogDescription>
              Update the plan&apos;s fees and borrowing rules. Members stay on
              the plan; changes apply to future loans.
            </DialogDescription>
          ) : null}
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Plan name"
                htmlFor={`${uid}-name`}
                error={errors.name}
              >
                <Input
                  id={`${uid}-name`}
                  value={values.name}
                  onChange={(event) => update("name", event.target.value)}
                  disabled={isSaving}
                  autoCapitalize="words"
                  aria-invalid={Boolean(errors.name)}
                  className={cn(
                    "h-11 rounded-[10px] bg-surface",
                    errors.name && "pr-44"
                  )}
                />
              </Field>

              <Field
                label="Billing term"
                htmlFor={`${uid}-billingTerm`}
                error={errors.billingTerm}
                position="right-9"
              >
                <select
                  id={`${uid}-billingTerm`}
                  value={values.billingTerm}
                  onChange={(event) =>
                    update(
                      "billingTerm",
                      event.target.value as MembershipPlanFormValues["billingTerm"]
                    )
                  }
                  disabled={isSaving}
                  aria-invalid={Boolean(errors.billingTerm)}
                  className="h-11 w-full appearance-none rounded-[10px] border border-border bg-surface pr-9 pl-3 text-sm text-text-primary focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {BILLING_TERM_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-text-secondary" />
              </Field>
            </div>

            <Field
              label="Description (optional)"
              htmlFor={`${uid}-description`}
              error={errors.description}
            >
              <Textarea
                id={`${uid}-description`}
                value={values.description}
                onChange={(event) =>
                  update("description", event.target.value)
                }
                disabled={isSaving}
                aria-invalid={Boolean(errors.description)}
                placeholder="What does this plan include?"
                className={cn(
                  "rounded-[10px] border-border bg-surface",
                  errors.description && "pr-44"
                )}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Price (UGX)" htmlFor={`${uid}-price`} error={errors.price}>
                <Input
                  id={`${uid}-price`}
                  type="number"
                  inputMode="numeric"
                  min="1"
                  value={values.price}
                  onChange={(event) => update("price", event.target.value)}
                  disabled={isSaving}
                  aria-invalid={Boolean(errors.price)}
                  placeholder="e.g. 15000"
                  className={cn(
                    "h-11 rounded-[10px] bg-surface",
                    errors.price && "pr-44"
                  )}
                />
              </Field>

              <Field
                label="Borrowing limit"
                htmlFor={`${uid}-borrowingLimit`}
                error={errors.borrowingLimit}
              >
                <Input
                  id={`${uid}-borrowingLimit`}
                  type="number"
                  inputMode="numeric"
                  min="1"
                  value={values.borrowingLimit}
                  onChange={(event) =>
                    update("borrowingLimit", event.target.value)
                  }
                  disabled={isSaving}
                  aria-invalid={Boolean(errors.borrowingLimit)}
                  placeholder="e.g. 3"
                  className={cn(
                    "h-11 rounded-[10px] bg-surface",
                    errors.borrowingLimit && "pr-44"
                  )}
                />
              </Field>

              <Field
                label="Loan period (days)"
                htmlFor={`${uid}-loanPeriodDays`}
                error={errors.loanPeriodDays}
              >
                <Input
                  id={`${uid}-loanPeriodDays`}
                  type="number"
                  inputMode="numeric"
                  min="1"
                  value={values.loanPeriodDays}
                  onChange={(event) =>
                    update("loanPeriodDays", event.target.value)
                  }
                  disabled={isSaving}
                  aria-invalid={Boolean(errors.loanPeriodDays)}
                  placeholder="e.g. 14"
                  className={cn(
                    "h-11 rounded-[10px] bg-surface",
                    errors.loanPeriodDays && "pr-44"
                  )}
                />
              </Field>
            </div>

            <Field label="Status" htmlFor={`${uid}-isActive`}>
              <label
                htmlFor={`${uid}-isActive`}
                className="flex h-11 w-full cursor-pointer items-center gap-2.5 rounded-[10px] border border-border bg-surface px-3 text-sm text-text-primary select-none"
              >
                <input
                  id={`${uid}-isActive`}
                  type="checkbox"
                  checked={values.isActive}
                  onChange={(event) =>
                    update("isActive", event.target.checked)
                  }
                  disabled={isSaving}
                  className="size-4 accent-primary"
                />
                {values.isActive
                  ? "Active — accepting new members"
                  : "Inactive — not accepting new members"}
              </label>
            </Field>
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
                ? "Saving…"
                : editing
                  ? "Save changes"
                  : "Add plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}