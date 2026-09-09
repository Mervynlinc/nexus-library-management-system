"use client"

import { useId, useState, type FormEvent } from "react"
import { Loader2 } from "lucide-react"

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
import { AuthorPhotoUpload } from "@/components/authors/photo-upload"
import {
  authorToFormValues,
  cleanAuthorFormValues,
  findDuplicateAuthor,
  isAuthorFormValid,
  validateAuthor,
  type Author,
  type AuthorFormErrors,
  type AuthorFormValues,
} from "@/lib/authors"

interface AuthorFormDialogProps {
  open: boolean
  author: Author | null
  authors: Author[]
  onOpenChange: (open: boolean) => void
  onSubmit: (values: AuthorFormValues) => Promise<void> | void
}

export function AuthorFormDialog({
  open,
  author,
  authors,
  onOpenChange,
  onSubmit,
}: AuthorFormDialogProps) {
  const editing = author !== null
  const uid = useId()
  const toast = useToast()

  const [values, setValues] = useState<AuthorFormValues>(() =>
    authorToFormValues(author)
  )
  const [errors, setErrors] = useState<AuthorFormErrors>({})
  const [isSaving, setIsSaving] = useState(false)

  function update<const K extends keyof AuthorFormValues>(
    field: K,
    value: AuthorFormValues[K]
  ) {
    setValues((previous) => ({ ...previous, [field]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (isSaving) return

    const cleaned = cleanAuthorFormValues(values)
    const nextErrors = validateAuthor(cleaned)
    if (!nextErrors.firstName && !nextErrors.lastName) {
      const duplicate = findDuplicateAuthor(
        authors,
        cleaned.firstName,
        cleaned.lastName,
        author?.id
      )
      if (duplicate) {
        nextErrors.lastName = "An author with this name already exists."
      }
    }
    setErrors(nextErrors)
    if (!isAuthorFormValid(nextErrors)) {
      toast({
        variant: "error",
        title: "Couldn't save the author",
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
        title: "Couldn't save the author",
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
            {editing ? "Edit author" : "Add new author"}
          </DialogTitle>
          {editing ? (
            <DialogDescription>
              Update the author record. Created and updated timestamps are
              maintained automatically.
            </DialogDescription>
          ) : null}
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-4">
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
            </div>

            <Field
              label="Bio"
              htmlFor={`${uid}-bio`}
              error={errors.bio}
              position="right-0"
            >
              <Textarea
                id={`${uid}-bio`}
                value={values.bio}
                onChange={(event) => update("bio", event.target.value)}
                disabled={isSaving}
                rows={4}
                maxLength={2000}
                placeholder="Short background on the author and their best-known works."
                aria-invalid={Boolean(errors.bio)}
                className="min-h-[96px] rounded-[10px] border-border bg-surface px-3 py-2.5 text-sm text-text-primary"
              />
            </Field>

            <Field
              label="Photo (optional)"
              htmlFor={`${uid}-photoUrl`}
              error={errors.photoUrl}
            >
              <AuthorPhotoUpload
                id={`${uid}-photoUrl`}
                value={values.photoUrl}
                onChange={(photoUrl) => update("photoUrl", photoUrl)}
                disabled={isSaving}
                error={Boolean(errors.photoUrl)}
              />
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
                  : "Add author"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}