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
import type { Publisher } from "@/lib/publishers"

interface DeletePublisherDialogProps {
  publisher: Publisher | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeletePublisherDialog({
  publisher,
  onOpenChange,
  onConfirm,
}: DeletePublisherDialogProps) {
  return (
    <Dialog open={publisher !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete publisher</DialogTitle>
          <DialogDescription>
            This will permanently remove &quot;{publisher?.name ?? ""}&quot;
            from the publishers list. This action cannot be undone.
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
