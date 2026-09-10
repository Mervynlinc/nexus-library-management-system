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
import type { Loan } from "@/lib/loans"
import type { Book } from "@/lib/books"
import type { Member } from "@/lib/members"

interface DeleteLoanDialogProps {
  loan: Loan | null
  books: Book[]
  members: Member[]
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteLoanDialog({
  loan,
  books,
  members,
  onOpenChange,
  onConfirm,
}: DeleteLoanDialogProps) {
  const book = books.find((b) => b.id === loan?.bookId)
  const member = members.find((m) => m.id === loan?.memberId)

  const description = loan
    ? `This will permanently remove the loan record for "${book?.title ?? "Unknown book"}" issued to ${member ? `${member.firstName} ${member.lastName}` : "Unknown member"}. This action cannot be undone.`
    : ""

  return (
    <Dialog open={loan !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete loan record</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
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
