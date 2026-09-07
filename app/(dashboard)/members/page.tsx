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
import { DeleteMemberDialog } from "@/components/members/delete-member-dialog"
import { MemberFormDialog } from "@/components/members/member-form-dialog"
import {
  memberFromFormValues,
  type Member,
  type MemberFormValues,
} from "@/lib/members"
import { SEED_MEMBERS } from "@/lib/mocks/members"
import { MOCK_MEMBERSHIP_PLANS } from "@/lib/mocks/membership-plans"

const PAGE_SIZE = 8

function membershipName(membershipId: string): string {
  return (
    MOCK_MEMBERSHIP_PLANS.find((plan) => plan.id === membershipId)?.name ?? "—"
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
            {totalItems === 1 ? "member" : "members"}
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

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>(SEED_MEMBERS)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [nationalityFilter, setNationalityFilter] = useState("all")
  const [membershipFilter, setMembershipFilter] = useState("all")
  const [formOpen, setFormOpen] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [deletingMember, setDeletingMember] = useState<Member | null>(null)
  const toast = useToast()

  const query = search.trim().toLowerCase()
  const nationalityOptions = Array.from(
    new Set(members.map((member) => member.nationality).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b))

  const filteredMembers = members.filter((member) => {
    if (
      nationalityFilter !== "all" &&
      member.nationality !== nationalityFilter
    ) {
      return false
    }
    if (
      membershipFilter !== "all" &&
      member.membershipId !== membershipFilter
    ) {
      return false
    }
    if (
      query &&
      !`${member.memberNumber} ${member.firstName} ${member.lastName} ${member.email}`
        .toLowerCase()
        .includes(query)
    ) {
      return false
    }
    return true
  })

  const filtersActive =
    search.trim() !== "" ||
    nationalityFilter !== "all" ||
    membershipFilter !== "all"
  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const visibleMembers = filteredMembers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  function updateSearch(value: string) {
    setSearch(value)
    setPage(1)
  }

  function resetFilters() {
    setSearch("")
    setNationalityFilter("all")
    setMembershipFilter("all")
    setPage(1)
  }

  function openCreate() {
    setEditingMember(null)
    setFormKey((key) => key + 1)
    setFormOpen(true)
  }

  function openEdit(member: Member) {
    setEditingMember(member)
    setFormKey((key) => key + 1)
    setFormOpen(true)
  }

  async function handleSubmit(values: MemberFormValues) {
    await new Promise((resolve) => setTimeout(resolve, 700))
    const now = new Date().toISOString()
    const fields = memberFromFormValues(values)

    setMembers((previous) => {
      if (editingMember === null) {
        return [
          {
            id: crypto.randomUUID(),
            memberNumber: values.memberNumber,
            ...fields,
            createdAt: now,
            updatedAt: now,
          },
          ...previous,
        ]
      }
      return previous.map((member) =>
        member.id === editingMember.id
          ? {
              ...member,
              ...fields,
              updatedAt: now,
            }
          : member
      )
    })
    setFormOpen(false)
    toast({
      variant: "success",
      title: editingMember === null ? "Member added" : "Member updated",
      description:
        editingMember === null
          ? `${values.firstName} ${values.lastName} added to the patrons list.`
          : `Changes to ${values.firstName} ${values.lastName} saved.`,
    })
  }

  function handleDelete() {
    if (deletingMember === null) return
    const removed = deletingMember
    setMembers((previous) =>
      previous.filter((member) => member.id !== removed.id)
    )
    setDeletingMember(null)
    toast({
      variant: "success",
      title: "Member deleted",
      description: `${removed.firstName} ${removed.lastName} removed from the patrons list.`,
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Members</h1>
          <p className="text-sm text-text-secondary">
            Patron records, memberships, and contact details.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus />
          Add member
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:max-w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-secondary" />
          <Input
            value={search}
            onChange={(event) => updateSearch(event.target.value)}
            placeholder="Search by member number, name, or email"
            aria-label="Search members"
            className="h-11 rounded-[10px] border-border bg-surface pl-9"
          />
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="relative">
            <select
              value={nationalityFilter}
              onChange={(event) => {
                setNationalityFilter(event.target.value)
                setPage(1)
              }}
              aria-label="Filter by nationality"
              className="h-11 appearance-none rounded-[10px] border border-border bg-surface pr-9 pl-3 text-sm text-text-primary focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-hidden"
            >
              <option value="all">All nationalities</option>
              {nationalityOptions.map((nationality) => (
                <option key={nationality} value={nationality}>
                  {nationality}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-text-secondary" />
          </div>
          <div className="relative">
            <select
              value={membershipFilter}
              onChange={(event) => {
                setMembershipFilter(event.target.value)
                setPage(1)
              }}
              aria-label="Filter by membership plan"
              className="h-11 appearance-none rounded-[10px] border border-border bg-surface pr-9 pl-3 text-sm text-text-primary focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-hidden"
            >
              <option value="all">All membership plans</option>
              {MOCK_MEMBERSHIP_PLANS.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
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
              <th className="w-28 px-5 py-3 text-left text-[12px] font-medium text-text-secondary">
                Member №
              </th>
              <th className="px-4 py-3 text-left text-[12px] font-medium text-text-secondary">
                Name
              </th>
              <th className="w-[16%] px-4 py-3 text-left text-[12px] font-medium text-text-secondary">
                Nationality
              </th>
              <th className="w-[18%] px-4 py-3 text-left text-[12px] font-medium text-text-secondary">
                Phone
              </th>
              <th className="w-[14%] px-4 py-3 text-left text-[12px] font-medium text-text-secondary">
                Membership
              </th>
              <th className="w-32 px-5 py-3 text-right text-[12px] font-medium text-text-secondary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {members.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-12 text-center text-sm text-text-secondary"
                >
                  No members yet. Click &quot;Add member&quot; to create the
                  first entry.
                </td>
              </tr>
            ) : filteredMembers.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-12 text-center text-sm text-text-secondary"
                >
                  No members match your search or filters.
                </td>
              </tr>
            ) : (
              visibleMembers.map((member) => (
                <tr
                  key={member.id}
                  className="transition-colors duration-150 hover:bg-muted/50"
                >
                  <td className="px-5 py-3 text-text-secondary tabular-nums">
                    {member.memberNumber}
                  </td>
                  <td className="px-4 py-3">
                    <span className="block truncate font-medium text-text-primary">
                      {`${member.firstName} ${member.lastName}`.trim()}
                    </span>
                  </td>
                  <td className="truncate px-4 py-3 text-text-secondary">
                    {member.nationality}
                  </td>
                  <td className="truncate px-4 py-3 text-text-secondary tabular-nums">
                    {member.phone}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {membershipName(member.membershipId)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(member)}
                        aria-label={`Edit ${member.firstName} ${member.lastName}`}
                        className="text-text-secondary hover:text-primary"
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingMember(member)}
                        aria-label={`Delete ${member.firstName} ${member.lastName}`}
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
        totalItems={filteredMembers.length}
        onPageChange={setPage}
      />

      <MemberFormDialog
        key={formKey}
        open={formOpen}
        member={editingMember}
        members={members}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
      />
      <DeleteMemberDialog
        member={deletingMember}
        onOpenChange={(open) => {
          if (!open) setDeletingMember(null)
        }}
        onConfirm={handleDelete}
      />
    </div>
  )
}