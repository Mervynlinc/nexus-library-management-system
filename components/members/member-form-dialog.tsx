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
import { MembershipSelect } from "@/components/members/membership-select"
import { PhotoUpload } from "@/components/members/photo-upload"
import {
  cleanMemberFormValues,
  findDuplicateMember,
  generateMemberNumber,
  isMemberFormValid,
  memberToFormValues,
  validateMember,
  type Member,
  type MemberFormErrors,
  type MemberFormValues,
} from "@/lib/members"
import { MOCK_MEMBERSHIP_PLANS } from "@/lib/mocks/membership-plans"

interface MemberFormDialogProps {
  open: boolean
  member: Member | null
  members: Member[]
  onOpenChange: (open: boolean) => void
  onSubmit: (values: MemberFormValues) => Promise<void> | void
}

export function MemberFormDialog({
  open,
  member,
  members,
  onOpenChange,
  onSubmit,
}: MemberFormDialogProps) {
  const editing = member !== null
  const uid = useId()
  const toast = useToast()

  const [values, setValues] = useState<MemberFormValues>(() =>
    memberToFormValues(member, generateMemberNumber(members))
  )
  const [errors, setErrors] = useState<MemberFormErrors>({})
  const [isSaving, setIsSaving] = useState(false)

  function update<const K extends keyof MemberFormValues>(
    field: K,
    value: MemberFormValues[K]
  ) {
    setValues((previous) => ({ ...previous, [field]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (isSaving) return

    const cleaned = cleanMemberFormValues(values)
    const nextErrors = validateMember(cleaned)
    if (!nextErrors.email) {
      const duplicate = findDuplicateMember(members, cleaned.email, member?.id)
      if (duplicate) nextErrors.email = "Email already in use by another member."
    }
    setErrors(nextErrors)
    if (!isMemberFormValid(nextErrors)) {
      toast({
        variant: "error",
        title: "Couldn't save the member",
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
        title: "Couldn't save the member",
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
            {editing ? "Edit member" : "Add new member"}
          </DialogTitle>
          {editing ? (
            <DialogDescription>
              Update the patron record. Member number, created, and updated
              timestamps are maintained automatically.
            </DialogDescription>
          ) : null}
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-4">
            <Field label="Member number" htmlFor={`${uid}-memberNumber`}>
              <Input
                id={`${uid}-memberNumber`}
                value={values.memberNumber}
                readOnly
                disabled={isSaving}
                aria-describedby={`${uid}-memberNumber-hint`}
                className="h-11 rounded-[10px] border-border bg-muted/50 text-text-secondary"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="First name"
                htmlFor={`${uid}-firstName`}
                error={errors.firstName}
              >
                <Input
                  id={`${uid}-firstName`}
                  value={values.firstName}
                  onChange={(event) =>
                    update("firstName", event.target.value)
                  }
                  disabled={isSaving}
                  autoCapitalize="words"
                  aria-invalid={Boolean(errors.firstName)}
                  className={cn(
                    "h-11 rounded-[10px] bg-surface",
                    errors.firstName && "pr-44"
                  )}
                />
              </Field>

              <Field
                label="Last name"
                htmlFor={`${uid}-lastName`}
                error={errors.lastName}
              >
                <Input
                  id={`${uid}-lastName`}
                  value={values.lastName}
                  onChange={(event) => update("lastName", event.target.value)}
                  disabled={isSaving}
                  autoCapitalize="words"
                  aria-invalid={Boolean(errors.lastName)}
                  className={cn(
                    "h-11 rounded-[10px] bg-surface",
                    errors.lastName && "pr-44"
                  )}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" htmlFor={`${uid}-email`} error={errors.email}>
                <Input
                  id={`${uid}-email`}
                  type="email"
                  inputMode="email"
                  autoCapitalize="none"
                  value={values.email}
                  onChange={(event) => update("email", event.target.value)}
                  disabled={isSaving}
                  aria-invalid={Boolean(errors.email)}
                  className={cn(
                    "h-11 rounded-[10px] bg-surface",
                    errors.email && "pr-44"
                  )}
                />
              </Field>

              <Field label="Phone" htmlFor={`${uid}-phone`} error={errors.phone}>
                <Input
                  id={`${uid}-phone`}
                  inputMode="tel"
                  autoCapitalize="off"
                  placeholder="e.g. +254 712 345 678"
                  value={values.phone}
                  onChange={(event) => update("phone", event.target.value)}
                  disabled={isSaving}
                  aria-invalid={Boolean(errors.phone)}
                  className={cn(
                    "h-11 rounded-[10px] bg-surface",
                    errors.phone && "pr-44"
                  )}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Nationality"
                htmlFor={`${uid}-nationality`}
                error={errors.nationality}
              >
                <Input
                  id={`${uid}-nationality`}
                  value={values.nationality}
                  onChange={(event) =>
                    update("nationality", event.target.value)
                  }
                  disabled={isSaving}
                  autoCapitalize="words"
                  placeholder="e.g. Kenyan"
                  aria-invalid={Boolean(errors.nationality)}
                  className={cn(
                    "h-11 rounded-[10px] bg-surface",
                    errors.nationality && "pr-44"
                  )}
                />
              </Field>

              <Field
                label="Date of birth"
                htmlFor={`${uid}-dateOfBirth`}
                error={errors.dateOfBirth}
              >
                <Input
                  id={`${uid}-dateOfBirth`}
                  type="date"
                  value={values.dateOfBirth}
                  onChange={(event) =>
                    update("dateOfBirth", event.target.value)
                  }
                  disabled={isSaving}
                  aria-invalid={Boolean(errors.dateOfBirth)}
                  className={cn(
                    "h-11 rounded-[10px] bg-surface",
                    errors.dateOfBirth && "pr-44"
                  )}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Photo (optional)"
                htmlFor={`${uid}-photoUrl`}
                error={errors.photoUrl}
              >
                <PhotoUpload
                  id={`${uid}-photoUrl`}
                  value={values.photoUrl}
                  onChange={(photoUrl) => update("photoUrl", photoUrl)}
                  disabled={isSaving}
                  error={Boolean(errors.photoUrl)}
                />
              </Field>

              <Field
                label="Membership"
                htmlFor={`${uid}-membershipId`}
                error={errors.membershipId}
                position="right-9"
              >
                <MembershipSelect
                  id={`${uid}-membershipId`}
                  plans={MOCK_MEMBERSHIP_PLANS}
                  value={values.membershipId}
                  onChange={(membershipId) =>
                    update("membershipId", membershipId)
                  }
                  disabled={isSaving}
                  error={Boolean(errors.membershipId)}
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
                ? "Saving…"
                : editing
                  ? "Save changes"
                  : "Add member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}