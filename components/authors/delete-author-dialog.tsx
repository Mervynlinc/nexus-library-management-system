"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Author } from "@/lib/authors"

interface DeleteAuthorDialogProps {
  author: Author | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteAuthorDialog({
  author,
  onOpenChange,
  onConfirm,
}: DeleteAuthorDialogProps) {
  const fullName = author
    ? `${author.firstName} ${author.lastName}`.trim()
    : ""

  return (
    <Dialog open={author !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete author</DialogTitle>
          <DialogDescription>
            This will permanently remove &quot;{fullName}&quot; from the
            authors list. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}