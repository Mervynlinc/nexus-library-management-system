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
import { DeleteAuthorDialog } from "@/components/authors/delete-author-dialog"
import { AuthorFormDialog } from "@/components/authors/author-form-dialog"
import {
  authorFromFormValues,
  type Author,
  type AuthorFormValues,
} from "@/lib/authors"
import { SEED_AUTHORS } from "@/lib/mocks/authors"

const PAGE_SIZE = 8

function authorInitials(author: Author): string {
  const first = author.firstName.trim().charAt(0)
  const last = author.lastName.trim().charAt(0)
  return `${first}${last}`.toUpperCase() || "?"
}

function formatDateOfBirth(dateOfBirth: string | null): string {
  if (!dateOfBirth) return "—"
  const [year, month, day] = dateOfBirth.split("-")
  if (!year || !month || !day) return "—"
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ]
  return `${day} ${months[Number(month) - 1] ?? ""} ${year}`
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
            {totalItems === 1 ? "author" : "authors"}
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

export default function AuthorsPage() {
  const [authors, setAuthors] = useState<Author[]>(SEED_AUTHORS)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [nationalityFilter, setNationalityFilter] = useState("all")
  const [formOpen, setFormOpen] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null)
  const [deletingAuthor, setDeletingAuthor] = useState<Author | null>(null)
  const toast = useToast()

  const query = search.trim().toLowerCase()
  const nationalityOptions = Array.from(
    new Set(authors.map((author) => author.nationality).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b))

  const filteredAuthors = authors.filter((author) => {
    if (
      nationalityFilter !== "all" &&
      author.nationality !== nationalityFilter
    ) {
      return false
    }
    if (
      query &&
      !`${author.firstName} ${author.lastName} ${author.nationality}`
        .toLowerCase()
        .includes(query)
    ) {
      return false
    }
    return true
  })

  const filtersActive =
    search.trim() !== "" || nationalityFilter !== "all"
  const totalPages = Math.max(1, Math.ceil(filteredAuthors.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const visibleAuthors = filteredAuthors.slice(
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
    setPage(1)
  }

  function openCreate() {
    setEditingAuthor(null)
    setFormKey((key) => key + 1)
    setFormOpen(true)
  }

  function openEdit(author: Author) {
    setEditingAuthor(author)
    setFormKey((key) => key + 1)
    setFormOpen(true)
  }

  async function handleSubmit(values: AuthorFormValues) {
    await new Promise((resolve) => setTimeout(resolve, 700))
    const now = new Date().toISOString()
    const fields = authorFromFormValues(values)

    setAuthors((previous) => {
      if (editingAuthor === null) {
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
      return previous.map((author) =>
        author.id === editingAuthor.id
          ? {
              ...author,
              ...fields,
              updatedAt: now,
            }
          : author
      )
    })
    setFormOpen(false)
    toast({
      variant: "success",
      title: editingAuthor === null ? "Author added" : "Author updated",
      description:
        editingAuthor === null
          ? `${values.firstName} ${values.lastName} added to the authors list.`
          : `Changes to ${values.firstName} ${values.lastName} saved.`,
    })
  }

  function handleDelete() {
    if (deletingAuthor === null) return
    const removed = deletingAuthor
    setAuthors((previous) =>
      previous.filter((author) => author.id !== removed.id)
    )
    setDeletingAuthor(null)
    toast({
      variant: "success",
      title: "Author deleted",
      description: `${removed.firstName} ${removed.lastName} removed from the authors list.`,
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Authors</h1>
          <p className="text-sm text-text-secondary">
            Author records and their works, with clean attribution across the
            catalog.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus />
          Add author
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:max-w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-secondary" />
          <Input
            value={search}
            onChange={(event) => updateSearch(event.target.value)}
            placeholder="Search by name or nationality"
            aria-label="Search authors"
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
              <th className="w-14 px-5 py-3 text-left text-[12px] font-medium text-text-secondary">
                Photo
              </th>
              <th className="px-4 py-3 text-left text-[12px] font-medium text-text-secondary">
                Name
              </th>
              <th className="w-[18%] px-4 py-3 text-left text-[12px] font-medium text-text-secondary">
                Nationality
              </th>
              <th className="w-[16%] px-4 py-3 text-left text-[12px] font-medium text-text-secondary">
                Born
              </th>
              <th className="w-32 px-5 py-3 text-right text-[12px] font-medium text-text-secondary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {authors.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-12 text-center text-sm text-text-secondary"
                >
                  No authors yet. Click &quot;Add author&quot; to create the
                  first entry.
                </td>
              </tr>
            ) : filteredAuthors.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-12 text-center text-sm text-text-secondary"
                >
                  No authors match your search or filters.
                </td>
              </tr>
            ) : (
              visibleAuthors.map((author) => (
                <tr
                  key={author.id}
                  className="transition-colors duration-150 hover:bg-muted/50"
                >
                  <td className="px-5 py-3">
                    {author.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={author.photoUrl}
                        alt={`${author.firstName} ${author.lastName}`}
                        className="size-9 rounded-full object-cover"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="bg-primary-tint flex size-9 items-center justify-center rounded-full text-xs font-medium text-primary"
                      >
                        {authorInitials(author)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    <span className="block truncate font-medium text-text-primary">
                      {`${author.firstName} ${author.lastName}`.trim()}
                    </span>
                  </td>
                  <td className="truncate px-4 py-3 text-text-secondary">
                    {author.nationality}
                  </td>
                  <td className="px-4 py-3 text-text-secondary tabular-nums">
                    {formatDateOfBirth(author.dateOfBirth)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(author)}
                        aria-label={`Edit ${author.firstName} ${author.lastName}`}
                        className="text-text-secondary hover:text-primary"
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingAuthor(author)}
                        aria-label={`Delete ${author.firstName} ${author.lastName}`}
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
        totalItems={filteredAuthors.length}
        onPageChange={setPage}
      />

      <AuthorFormDialog
        key={formKey}
        open={formOpen}
        author={editingAuthor}
        authors={authors}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
      />
      <DeleteAuthorDialog
        author={deletingAuthor}
        onOpenChange={(open) => {
          if (!open) setDeletingAuthor(null)
        }}
        onConfirm={handleDelete}
      />
    </div>
  )
}