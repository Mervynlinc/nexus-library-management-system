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

interface LendBookDialogProps {
  book: Book | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function LendBookDialog({
  book,
  onOpenChange,
  onConfirm,
}: LendBookDialogProps) {
  const availableCopies = book?.availableCopies ?? 0

  return (
    <Dialog open={book !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lend book</DialogTitle>
          <DialogDescription>
            Lend &quot;{book?.title}&quot; to a member. {availableCopies} copy
            {availableCopies === 1 ? " is" : "s are"} currently available.
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
          <Button
            type="button"
            disabled={availableCopies === 0}
            onClick={onConfirm}
          >
            Lend
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}