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
import type { Book } from "@/lib/books"

interface DeleteBookDialogProps {
  book: Book | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteBookDialog({
  book,
  onOpenChange,
  onConfirm,
}: DeleteBookDialogProps) {
  return (
    <Dialog open={book !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete book</DialogTitle>
          <DialogDescription>
            This will permanently remove &quot;{book?.title}&quot; from the
            catalog. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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