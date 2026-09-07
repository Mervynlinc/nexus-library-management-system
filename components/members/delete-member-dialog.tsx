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
import type { Member } from "@/lib/members"

interface DeleteMemberDialogProps {
  member: Member | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteMemberDialog({
  member,
  onOpenChange,
  onConfirm,
}: DeleteMemberDialogProps) {
  const fullName = member
    ? `${member.firstName} ${member.lastName}`.trim()
    : ""

  return (
    <Dialog open={member !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete member</DialogTitle>
          <DialogDescription>
            This will permanently remove &quot;{fullName}&quot; (
            {member?.memberNumber}) from the patrons list. This action cannot
            be undone.
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