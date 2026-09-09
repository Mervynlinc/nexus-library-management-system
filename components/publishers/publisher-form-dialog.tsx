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
import {
  publisherToFormValues,
  cleanPublisherFormValues,
  findDuplicatePublisher,
  isPublisherFormValid,
  validatePublisher,
  type Publisher,
  type PublisherFormErrors,
  type PublisherFormValues,
} from "@/lib/publishers"

interface PublisherFormDialogProps {
  open: boolean
  publisher: Publisher | null
  publishers: Publisher[]
  onOpenChange: (open: boolean) => void
  onSubmit: (values: PublisherFormValues) => Promise<void> | void
}

export function PublisherFormDialog({
  open,
  publisher,
  publishers,
  onOpenChange,
  onSubmit,
}: PublisherFormDialogProps) {
  const editing = publisher !== null
  const uid = useId()
  const toast = useToast()

  const [values, setValues] = useState<PublisherFormValues>(() =>
    publisherToFormValues(publisher)
  )
  const [errors, setErrors] = useState<PublisherFormErrors>({})
  const [isSaving, setIsSaving] = useState(false)

  function update<const K extends keyof PublisherFormValues>(
    field: K,
    value: PublisherFormValues[K]
  ) {
    setValues((previous) => ({ ...previous, [field]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (isSaving) return

    const cleaned = cleanPublisherFormValues(values)
    const nextErrors = validatePublisher(cleaned)
    if (!nextErrors.name) {
      const duplicate = findDuplicatePublisher(
        publishers,
        cleaned.name,
        publisher?.id
      )
      if (duplicate) {
        nextErrors.name = "A publisher with this name already exists."
      }
    }
    setErrors(nextErrors)
    if (!isPublisherFormValid(nextErrors)) {
      toast({
        variant: "error",
        title: "Couldn't save the publisher",
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
        title: "Couldn't save the publisher",
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
            {editing ? "Edit publisher" : "Add new publisher"}
          </DialogTitle>
          {editing ? (
            <DialogDescription>
              Update the publisher record. Created and updated timestamps are
              maintained automatically.
            </DialogDescription>
          ) : null}
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-4">
            <Field
              label="Publisher name"
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
              label="Address"
              htmlFor={`${uid}-address`}
              error={errors.address}
            >
              <Input
                id={`${uid}-address`}
                value={values.address}
                onChange={(event) => update("address", event.target.value)}
                disabled={isSaving}
                aria-invalid={Boolean(errors.address)}
                className={cn(
                  "h-11 rounded-[10px] bg-surface",
                  errors.address && "pr-44"
                )}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Country"
                htmlFor={`${uid}-country`}
                error={errors.country}
              >
                <Input
                  id={`${uid}-country`}
                  value={values.country}
                  onChange={(event) => update("country", event.target.value)}
                  disabled={isSaving}
                  autoCapitalize="words"
                  aria-invalid={Boolean(errors.country)}
                  className={cn(
                    "h-11 rounded-[10px] bg-surface",
                    errors.country && "pr-44"
                  )}
                />
              </Field>

              <Field
                label="Website (optional)"
                htmlFor={`${uid}-website`}
                error={errors.website}
              >
                <Input
                  id={`${uid}-website`}
                  value={values.website}
                  onChange={(event) => update("website", event.target.value)}
                  disabled={isSaving}
                  placeholder="https://"
                  aria-invalid={Boolean(errors.website)}
                  className={cn(
                    "h-11 rounded-[10px] bg-surface",
                    errors.website && "pr-44"
                  )}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Contact email"
                htmlFor={`${uid}-contactEmail`}
                error={errors.contactEmail}
              >
                <Input
                  id={`${uid}-contactEmail`}
                  type="email"
                  value={values.contactEmail}
                  onChange={(event) =>
                    update("contactEmail", event.target.value)
                  }
                  disabled={isSaving}
                  aria-invalid={Boolean(errors.contactEmail)}
                  className={cn(
                    "h-11 rounded-[10px] bg-surface",
                    errors.contactEmail && "pr-44"
                  )}
                />
              </Field>

              <Field
                label="Contact phone"
                htmlFor={`${uid}-contactPhone`}
                error={errors.contactPhone}
              >
                <Input
                  id={`${uid}-contactPhone`}
                  type="tel"
                  value={values.contactPhone}
                  onChange={(event) =>
                    update("contactPhone", event.target.value)
                  }
                  disabled={isSaving}
                  aria-invalid={Boolean(errors.contactPhone)}
                  className={cn(
                    "h-11 rounded-[10px] bg-surface",
                    errors.contactPhone && "pr-44"
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
                  : "Add publisher"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
