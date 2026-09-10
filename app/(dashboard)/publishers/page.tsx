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
import { DeletePublisherDialog } from "@/components/publishers/delete-publisher-dialog"
import { PublisherFormDialog } from "@/components/publishers/publisher-form-dialog"
import {
  publisherFromFormValues,
  type Publisher,
  type PublisherFormValues,
} from "@/lib/publishers"
import { SEED_PUBLISHERS } from "@/lib/mocks/publishers-seed"

const PAGE_SIZE = 8

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
            {totalItems === 1 ? "publisher" : "publishers"}
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

export default function PublishersPage() {
  const [publishers, setPublishers] = useState<Publisher[]>(SEED_PUBLISHERS)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [countryFilter, setCountryFilter] = useState("all")
  const [formOpen, setFormOpen] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const [editingPublisher, setEditingPublisher] = useState<Publisher | null>(
    null
  )
  const [deletingPublisher, setDeletingPublisher] = useState<Publisher | null>(
    null
  )
  const toast = useToast()

  const query = search.trim().toLowerCase()
  const countryOptions = Array.from(
    new Set(publishers.map((publisher) => publisher.country).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b))

  const filteredPublishers = publishers.filter((publisher) => {
    if (countryFilter !== "all" && publisher.country !== countryFilter) {
      return false
    }
    if (
      query &&
      !`${publisher.name} ${publisher.country} ${publisher.contactEmail}`
        .toLowerCase()
        .includes(query)
    ) {
      return false
    }
    return true
  })

  const filtersActive = search.trim() !== "" || countryFilter !== "all"
  const totalPages = Math.max(
    1,
    Math.ceil(filteredPublishers.length / PAGE_SIZE)
  )
  const currentPage = Math.min(page, totalPages)
  const visiblePublishers = filteredPublishers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  function updateSearch(value: string) {
    setSearch(value)
    setPage(1)
  }

  function resetFilters() {
    setSearch("")
    setCountryFilter("all")
    setPage(1)
  }

  function openCreate() {
    setEditingPublisher(null)
    setFormKey((key) => key + 1)
    setFormOpen(true)
  }

  function openEdit(publisher: Publisher) {
    setEditingPublisher(publisher)
    setFormKey((key) => key + 1)
    setFormOpen(true)
  }

  async function handleSubmit(values: PublisherFormValues) {
    await new Promise((resolve) => setTimeout(resolve, 700))
    const now = new Date().toISOString()
    const fields = publisherFromFormValues(values)

    setPublishers((previous) => {
      if (editingPublisher === null) {
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
      return previous.map((publisher) =>
        publisher.id === editingPublisher.id
          ? { ...publisher, ...fields, updatedAt: now }
          : publisher
      )
    })
    setFormOpen(false)
    toast({
      variant: "success",
      title:
        editingPublisher === null ? "Publisher added" : "Publisher updated",
      description:
        editingPublisher === null
          ? `${values.name} added to the publishers list.`
          : `Changes to ${values.name} saved.`,
    })
  }

  function handleDelete() {
    if (deletingPublisher === null) return
    const removed = deletingPublisher
    setPublishers((previous) =>
      previous.filter((publisher) => publisher.id !== removed.id)
    )
    setDeletingPublisher(null)
    toast({
      variant: "success",
      title: "Publisher deleted",
      description: `${removed.name} removed from the publishers list.`,
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Publishers</h1>
          <p className="text-sm text-text-secondary">
            Publisher records, imprints, and which titles they supply.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus />
          Add publisher
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:max-w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-secondary" />
          <Input
            value={search}
            onChange={(event) => updateSearch(event.target.value)}
            placeholder="Search by name, country, or email"
            aria-label="Search publishers"
            className="h-11 rounded-[10px] border-border bg-surface pl-9"
          />
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="relative">
            <select
              value={countryFilter}
              onChange={(event) => {
                setCountryFilter(event.target.value)
                setPage(1)
              }}
              aria-label="Filter by country"
              className="h-11 appearance-none rounded-[10px] border border-border bg-surface pr-9 pl-3 text-sm text-text-primary focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-hidden"
            >
              <option value="all">All countries</option>
              {countryOptions.map((country) => (
                <option key={country} value={country}>
                  {country}
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
              <th className="px-5 py-3 text-left text-[12px] font-medium text-text-secondary">
                Name
              </th>
              <th className="w-[22%] px-4 py-3 text-left text-[12px] font-medium text-text-secondary">
                Country
              </th>
              <th className="w-[20%] px-4 py-3 text-left text-[12px] font-medium text-text-secondary">
                Email
              </th>
              <th className="w-[16%] px-4 py-3 text-left text-[12px] font-medium text-text-secondary">
                Phone
              </th>
              <th className="w-32 px-5 py-3 text-right text-[12px] font-medium text-text-secondary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {publishers.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-12 text-center text-sm text-text-secondary"
                >
                  No publishers yet. Click &quot;Add publisher&quot; to create
                  the first entry.
                </td>
              </tr>
            ) : filteredPublishers.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-12 text-center text-sm text-text-secondary"
                >
                  No publishers match your search or filters.
                </td>
              </tr>
            ) : (
              visiblePublishers.map((publisher) => (
                <tr
                  key={publisher.id}
                  className="transition-colors duration-150 hover:bg-muted/50"
                >
                  <td className="px-5 py-3">
                    <span className="block truncate font-medium text-text-primary">
                      {publisher.name}
                    </span>
                    {publisher.website ? (
                      <span className="block truncate text-xs text-text-secondary">
                        {publisher.website}
                      </span>
                    ) : null}
                  </td>
                  <td className="truncate px-4 py-3 text-text-secondary">
                    {publisher.country}
                  </td>
                  <td className="truncate px-4 py-3 text-text-secondary">
                    {publisher.contactEmail}
                  </td>
                  <td className="px-4 py-3 text-text-secondary tabular-nums">
                    {publisher.contactPhone}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(publisher)}
                        aria-label={`Edit ${publisher.name}`}
                        className="text-text-secondary hover:text-primary"
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingPublisher(publisher)}
                        aria-label={`Delete ${publisher.name}`}
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
        totalItems={filteredPublishers.length}
        onPageChange={setPage}
      />

      <PublisherFormDialog
        key={formKey}
        open={formOpen}
        publisher={editingPublisher}
        publishers={publishers}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
      />
      <DeletePublisherDialog
        publisher={deletingPublisher}
        onOpenChange={(open) => {
          if (!open) setDeletingPublisher(null)
        }}
        onConfirm={handleDelete}
      />
    </div>
  )
}
