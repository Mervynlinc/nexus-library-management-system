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
import type { Loan } from "@/lib/loans"
import type { Book } from "@/lib/books"
import type { Member } from "@/lib/members"

interface ReturnLoanDialogProps {
  loan: Loan | null
  books: Book[]
  members: Member[]
  onOpenChange: (open: boolean) => void
  onConfirm: (returnDate: string) => void
}

export function ReturnLoanDialog({
  loan,
  books,
  members,
  onOpenChange,
  onConfirm,
}: ReturnLoanDialogProps) {
  const toast = useToast()
  const [isProcessing, setIsProcessing] = useState(false)

  const book = books.find((b) => b.id === loan?.bookId)
  const member = members.find((m) => m.id === loan?.memberId)

  function handleConfirm() {
    if (!loan) return
    setIsProcessing(true)
    const today = new Date().toISOString().slice(0, 10)
    try {
      onConfirm(today)
    } catch {
      toast({
        variant: "error",
        title: "Couldn't process return",
        description: "Something went wrong. Please try again.",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={loan !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Return book</DialogTitle>
          <DialogDescription>
            Mark &quot;{book?.title ?? "Unknown"}&quot; as returned by{" "}
            {member
              ? `${member.firstName} ${member.lastName}`
              : "Unknown member"}
            . The return date will be set to today.
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
            {isProcessing ? "Processing\u2026" : "Confirm return"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
