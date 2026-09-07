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
import { PublisherSelect } from "@/components/books/publisher-select"
import {
  bookToFormValues,
  cleanBookFormValues,
  findDuplicateBook,
  isBookFormValid,
  toDigits,
  type Book,
  type BookFormErrors,
  type BookFormValues,
  validateBook,
} from "@/lib/books"
import { MOCK_PUBLISHERS } from "@/lib/mocks/publishers"

interface BookFormDialogProps {
  open: boolean
  book: Book | null
  books: Book[]
  onOpenChange: (open: boolean) => void
  onSubmit: (values: BookFormValues) => Promise<void> | void
}

export function BookFormDialog({
  open,
  book,
  books,
  onOpenChange,
  onSubmit,
}: BookFormDialogProps) {
  const editing = book !== null
  const uid = useId()
  const toast = useToast()

  const [values, setValues] = useState<BookFormValues>(() =>
    bookToFormValues(book)
  )
  const [errors, setErrors] = useState<BookFormErrors>({})
  const [isSaving, setIsSaving] = useState(false)

  function update<const K extends keyof BookFormValues>(
    field: K,
    value: BookFormValues[K]
  ) {
    setValues((previous) => ({ ...previous, [field]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (isSaving) return

    const cleaned = cleanBookFormValues(values)
    const nextErrors = validateBook(cleaned)
    if (!nextErrors.isbn) {
      const duplicate = findDuplicateBook(books, cleaned.isbn, book?.id)
      if (duplicate) nextErrors.isbn = "ISBN already exists."
    }
    setErrors(nextErrors)
    if (!isBookFormValid(nextErrors)) {
      toast({
        variant: "error",
        title: "Couldn't save the book",
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
        title: "Couldn't save the book",
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
          <DialogTitle>{editing ? "Edit book" : "Add new book"}</DialogTitle>
          {editing ? (
            <DialogDescription>
              Update the catalog entry. ID, created, and updated timestamps
              are maintained automatically.
            </DialogDescription>
          ) : null}
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-4">
            <Field label="Title" htmlFor={`${uid}-title`} error={errors.title}>
              <Input
                id={`${uid}-title`}
                value={values.title}
                onChange={(event) => update("title", event.target.value)}
                disabled={isSaving}
                aria-invalid={Boolean(errors.title)}
                className={cn(
                  "h-11 rounded-[10px] bg-surface",
                  errors.title && "pr-44"
                )}
              />
            </Field>

            <Field
              label="Author"
              htmlFor={`${uid}-author`}
              error={errors.author}
            >
              <Input
                id={`${uid}-author`}
                value={values.author}
                onChange={(event) => update("author", event.target.value)}
                disabled={isSaving}
                aria-invalid={Boolean(errors.author)}
                className={cn(
                  "h-11 rounded-[10px] bg-surface",
                  errors.author && "pr-44"
                )}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="ISBN" htmlFor={`${uid}-isbn`} error={errors.isbn}>
                <Input
                  id={`${uid}-isbn`}
                  inputMode="numeric"
                  autoCapitalize="off"
                  value={values.isbn}
                  onChange={(event) =>
                    update("isbn", toDigits(event.target.value))
                  }
                  disabled={isSaving}
                  aria-invalid={Boolean(errors.isbn)}
                  className={cn(
                    "h-11 rounded-[10px] bg-surface",
                    errors.isbn && "pr-44"
                  )}
                />
              </Field>

              <Field
                label="Language"
                htmlFor={`${uid}-language`}
                error={errors.language}
              >
                <Input
                  id={`${uid}-language`}
                  value={values.language}
                  onChange={(event) => update("language", event.target.value)}
                  disabled={isSaving}
                  aria-invalid={Boolean(errors.language)}
                  className={cn(
                    "h-11 rounded-[10px] bg-surface",
                    errors.language && "pr-40"
                  )}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Publication year"
                htmlFor={`${uid}-publishedYear`}
                error={errors.publishedYear}
              >
                <Input
                  id={`${uid}-publishedYear`}
                  inputMode="numeric"
                  autoCapitalize="off"
                  placeholder="e.g. 2017"
                  maxLength={4}
                  value={values.publishedYear}
                  onChange={(event) =>
                    update("publishedYear", toDigits(event.target.value))
                  }
                  disabled={isSaving}
                  aria-invalid={Boolean(errors.publishedYear)}
                  className={cn(
                    "h-11 rounded-[10px] bg-surface",
                    errors.publishedYear && "pr-44"
                  )}
                />
              </Field>

              <Field
                label="Edition"
                htmlFor={`${uid}-edition`}
                error={errors.edition}
              >
                <Input
                  id={`${uid}-edition`}
                  value={values.edition}
                  onChange={(event) => update("edition", event.target.value)}
                  disabled={isSaving}
                  placeholder="e.g. 2nd edition"
                  aria-invalid={Boolean(errors.edition)}
                  className={cn(
                    "h-11 rounded-[10px] bg-surface",
                    errors.edition && "pr-44"
                  )}
                />
              </Field>
            </div>

            <Field
              label="Publisher"
              htmlFor={`${uid}-publisher`}
              error={errors.publisherId}
              position="right-9"
            >
              <PublisherSelect
                id={`${uid}-publisher`}
                publishers={MOCK_PUBLISHERS}
                value={values.publisherId}
                onChange={(publisherId) =>
                  update("publisherId", publisherId)
                }
                disabled={isSaving}
                error={Boolean(errors.publisherId)}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Genre" htmlFor={`${uid}-genre`} error={errors.genre}>
                <Input
                  id={`${uid}-genre`}
                  value={values.genre}
                  onChange={(event) => update("genre", event.target.value)}
                  disabled={isSaving}
                  placeholder="e.g. Science Fiction"
                  aria-invalid={Boolean(errors.genre)}
                  className={cn(
                    "h-11 rounded-[10px] bg-surface",
                    errors.genre && "pr-44"
                  )}
                />
              </Field>

              <Field
                label="Total copies"
                htmlFor={`${uid}-totalCopies`}
                error={errors.totalCopies}
              >
                <Input
                  id={`${uid}-totalCopies`}
                  inputMode="numeric"
                  autoCapitalize="off"
                  value={values.totalCopies}
                  onChange={(event) =>
                    update("totalCopies", toDigits(event.target.value))
                  }
                  disabled={isSaving}
                  aria-invalid={Boolean(errors.totalCopies)}
                  className={cn(
                    "h-11 rounded-[10px] bg-surface",
                    errors.totalCopies && "pr-44"
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
              {isSaving ? (
                <Loader2 className="animate-spin" />
              ) : null}
              {isSaving
                ? "Saving…"
                : editing
                  ? "Save changes"
                  : "Add book"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}