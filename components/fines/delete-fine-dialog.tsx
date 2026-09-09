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
import type { Fine } from "@/lib/fines"
import { formatUGX } from "@/lib/fines"
import type { Book } from "@/lib/books"
import type { Member } from "@/lib/members"

interface DeleteFineDialogProps {
  fine: Fine | null
  books: Book[]
  members: Member[]
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteFineDialog({
  fine,
  books,
  members,
  onOpenChange,
  onConfirm,
}: DeleteFineDialogProps) {
  const book = books.find((b) => b.id === fine?.bookId)
  const member = members.find((m) => m.id === fine?.memberId)

  const description = fine
    ? `This will permanently remove the ${formatUGX(fine.amount)} fine for "${book?.title ?? "Unknown book"}" issued to ${member ? `${member.firstName} ${member.lastName}` : "Unknown member"}. This action cannot be undone.`
    : ""

  return (
    <Dialog open={fine !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete fine record</DialogTitle>
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