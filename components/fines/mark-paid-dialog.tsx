"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toast"
import type { Fine } from "@/lib/fines"
import { formatUGX } from "@/lib/fines"
import type { Book } from "@/lib/books"
import type { Member } from "@/lib/members"

interface MarkPaidDialogProps {
  fine: Fine | null
  books: Book[]
  members: Member[]
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function MarkPaidDialog({
  fine,
  books,
  members,
  onOpenChange,
  onConfirm,
}: MarkPaidDialogProps) {
  const toast = useToast()
  const [isProcessing, setIsProcessing] = useState(false)

  const book = books.find((b) => b.id === fine?.bookId)
  const member = members.find((m) => m.id === fine?.memberId)

  function handleConfirm() {
    if (!fine) return
    setIsProcessing(true)
    try {
      onConfirm()
    } catch {
      toast({
        variant: "error",
        title: "Couldn't record payment",
        description: "Something went wrong. Please try again.",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={fine !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark fine as paid</DialogTitle>
          <DialogDescription>
            Record a payment of {fine ? formatUGX(fine.amount) : "\u2014"} for
            &quot;{book?.title ?? "Unknown"}&quot; by{" "}
            {member
              ? `${member.firstName} ${member.lastName}`
              : "Unknown member"}
            . This will set the fine to Paid.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isProcessing}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            disabled={isProcessing}
            onClick={handleConfirm}
          >
            {isProcessing ? <Loader2 className="animate-spin" /> : null}
            {isProcessing ? "Processing\u2026" : "Mark as paid"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}