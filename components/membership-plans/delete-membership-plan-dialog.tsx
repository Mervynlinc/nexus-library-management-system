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
import type { MembershipPlan } from "@/lib/membership-plans"

interface DeleteMembershipPlanDialogProps {
  plan: MembershipPlan | null
  memberCount: number
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteMembershipPlanDialog({
  plan,
  memberCount,
  onOpenChange,
  onConfirm,
}: DeleteMembershipPlanDialogProps) {
  const description = plan
    ? `This will permanently remove the "${plan.name}" plan. This action cannot be undone.${
        memberCount > 0
          ? ` ${memberCount} member${
              memberCount === 1 ? "" : "s"
            } is currently on this plan.`
          : ""
      }`
    : ""

  return (
    <Dialog open={plan !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete membership plan</DialogTitle>
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