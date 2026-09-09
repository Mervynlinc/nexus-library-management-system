"use client"

import { useState } from "react"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"
import { DeleteMembershipPlanDialog } from "@/components/membership-plans/delete-membership-plan-dialog"
import { MembershipPlanFormDialog } from "@/components/membership-plans/membership-plan-form-dialog"
import {
  billingTermText,
  membershipPlanFromFormValues,
  type MembershipPlan,
  type MembershipPlanFormValues,
} from "@/lib/membership-plans"
import { SEED_MEMBERSHIP_PLANS } from "@/lib/mocks/membership-plans-seed"
import { SEED_MEMBERS } from "@/lib/mocks/members"
import { formatUGX } from "@/lib/utils"

const PAGE_SIZE = 8

function memberCount(membershipId: string): number {
  return SEED_MEMBERS.filter(
    (member) => member.membershipId === membershipId
  ).length
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="bg-success-tint inline-block rounded-full px-2.5 py-0.5 text-xs font-medium text-success">
      Active
    </span>
  ) : (
    <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium text-text-secondary bg-muted">
      Inactive
    </span>
  )
}

function Pagination({
  page,
  totalItems,
  onPageChange,
}: {
  page: number
  totalItems: number
  onPageChange: (page: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
  const start = totalItems === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const end = Math.min(page * PAGE_SIZE, totalItems)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-text-secondary">
        {totalItems === 0 ? (
          "No entries to show."
        ) : (
          <>
            Showing <span className="font-medium text-text-primary">{start}</span>–
            <span className="font-medium text-text-primary">{end}</span> of{" "}
            <span className="font-medium text-text-primary">{totalItems}</span>{" "}
            {totalItems === 1 ? "plan" : "plans"}
          </>
        )}
      </p>
      {totalPages > 1 ? (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft />
          </Button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (number) => (
              <Button
                key={number}
                size="icon"
                variant={number === page ? "default" : "outline"}
                onClick={() => onPageChange(number)}
                aria-label={`Go to page ${number}`}
                aria-current={number === page ? "page" : undefined}
              >
                {number}
              </Button>
            )
          )}
          <Button
            variant="outline"
            size="icon"
            disabled={page === totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            <ChevronRight />
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export default function MembershipPlansPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>(SEED_MEMBERSHIP_PLANS)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all")
  const [formOpen, setFormOpen] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null)
  const [deletingPlan, setDeletingPlan] = useState<MembershipPlan | null>(null)
  const toast = useToast()

  const query = search.trim().toLowerCase()

  const filteredPlans = plans.filter((plan) => {
    if (
      statusFilter === "active" &&
      !plan.isActive
    ) {
      return false
    }
    if (
      statusFilter === "inactive" &&
      plan.isActive
    ) {
      return false
    }
    if (
      query &&
      !`${plan.name} ${plan.description}`.toLowerCase().includes(query)
    ) {
      return false
    }
    return true
  })

  const filtersActive = search.trim() !== "" || statusFilter !== "all"
  const totalPages = Math.max(1, Math.ceil(filteredPlans.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const visiblePlans = filteredPlans.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  function updateSearch(value: string) {
    setSearch(value)
    setPage(1)
  }

  function resetFilters() {
    setSearch("")
    setStatusFilter("all")
    setPage(1)
  }

  function openCreate() {
    setEditingPlan(null)
    setFormKey((key) => key + 1)
    setFormOpen(true)
  }

  function openEdit(plan: MembershipPlan) {
    setEditingPlan(plan)
    setFormKey((key) => key + 1)
    setFormOpen(true)
  }

  async function handleSubmit(values: MembershipPlanFormValues) {
    await new Promise((resolve) => setTimeout(resolve, 700))
    const now = new Date().toISOString()
    const fields = membershipPlanFromFormValues(values)

    setPlans((previous) => {
      if (editingPlan === null) {
        return [
          {
            id: crypto.randomUUID(),
            ...fields,
            createdAt: now,
            updatedAt: now,
          },
          ...previous,
        ]
      }
      return previous.map((plan) =>
        plan.id === editingPlan.id
          ? { ...plan, ...fields, updatedAt: now }
          : plan
      )
    })
    setFormOpen(false)
    toast({
      variant: "success",
      title: editingPlan === null ? "Plan added" : "Plan updated",
      description:
        editingPlan === null
          ? `${values.name} added to the plans list.`
          : `Changes to ${values.name} saved.`,
    })
  }

  function handleDelete() {
    if (deletingPlan === null) return
    const removed = deletingPlan
    setPlans((previous) =>
      previous.filter((plan) => plan.id !== removed.id)
    )
    setDeletingPlan(null)
    toast({
      variant: "success",
      title: "Plan deleted",
      description: `${removed.name} removed from the plans list.`,
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">
            Membership Plans
          </h1>
          <p className="text-sm text-text-secondary">
            Plan tiers, fees, borrowing limits, and loan duration rules that
            bound patron privileges.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus />
          Add plan
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:max-w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-secondary" />
          <Input
            value={search}
            onChange={(event) => updateSearch(event.target.value)}
            placeholder="Search by plan name or description"
            aria-label="Search membership plans"
            className="h-11 rounded-[10px] border-border bg-surface pl-9"
          />
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(
                  event.target.value as "all" | "active" | "inactive"
                )
                setPage(1)
              }}
              aria-label="Filter by status"
              className="h-11 appearance-none rounded-[10px] border border-border bg-surface pr-9 pl-3 text-sm text-text-primary focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-hidden"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-text-secondary" />
          </div>
          {filtersActive ? (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Reset
            </Button>
          ) : null}
        </div>
      </div>

      <div className="bg-surface overflow-hidden rounded-[14px] border border-border">
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-5 py-3 text-left text-[12px] font-medium text-text-secondary">
                Plan
              </th>
              <th className="w-[16%] px-4 py-3 text-left text-[12px] font-medium text-text-secondary">
                Price
              </th>
              <th className="w-[13%] px-4 py-3 text-left text-[12px] font-medium text-text-secondary">
                Borrowing limit
              </th>
              <th className="w-[12%] px-4 py-3 text-left text-[12px] font-medium text-text-secondary">
                Loan period
              </th>
              <th className="w-[10%] px-4 py-3 text-left text-[12px] font-medium text-text-secondary">
                Members
              </th>
              <th className="w-[11%] px-4 py-3 text-left text-[12px] font-medium text-text-secondary">
                Status
              </th>
              <th className="w-28 px-5 py-3 text-right text-[12px] font-medium text-text-secondary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {plans.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-12 text-center text-sm text-text-secondary"
                >
                  No plans yet. Click &quot;Add plan&quot; to create the first
                  entry.
                </td>
              </tr>
            ) : filteredPlans.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-12 text-center text-sm text-text-secondary"
                >
                  No plans match your search or filters.
                </td>
              </tr>
            ) : (
              visiblePlans.map((plan) => (
                <tr
                  key={plan.id}
                  className="transition-colors duration-150 hover:bg-muted/50"
                >
                  <td className="px-5 py-3">
                    <span className="block truncate font-medium text-text-primary">
                      {plan.name}
                    </span>
                    <span className="block truncate text-xs text-text-secondary">
                      {plan.description}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="block font-medium text-text-primary tabular-nums">
                      {formatUGX(plan.price)}
                    </span>
                    <span className="block text-xs text-text-secondary capitalize">
                      {billingTermText(plan.billingTerm)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary tabular-nums">
                    {plan.borrowingLimit}{" "}
                    {plan.borrowingLimit === 1 ? "copy" : "copies"}
                  </td>
                  <td className="px-4 py-3 text-text-secondary tabular-nums">
                    {plan.loanPeriodDays}{" "}
                    {plan.loanPeriodDays === 1 ? "day" : "days"}
                  </td>
                  <td className="px-4 py-3 text-text-secondary tabular-nums">
                    {memberCount(plan.id)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge isActive={plan.isActive} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(plan)}
                        aria-label={`Edit ${plan.name}`}
                        className="text-text-secondary hover:text-primary"
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingPlan(plan)}
                        aria-label={`Delete ${plan.name}`}
                        className="text-text-secondary hover:bg-danger-tint hover:text-danger"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={currentPage}
        totalItems={filteredPlans.length}
        onPageChange={setPage}
      />

      <MembershipPlanFormDialog
        key={formKey}
        open={formOpen}
        plan={editingPlan}
        plans={plans}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
      />
      <DeleteMembershipPlanDialog
        plan={deletingPlan}
        memberCount={
          deletingPlan === null ? 0 : memberCount(deletingPlan.id)
        }
        onOpenChange={(open) => {
          if (!open) setDeletingPlan(null)
        }}
        onConfirm={handleDelete}
      />
    </div>
  )
}