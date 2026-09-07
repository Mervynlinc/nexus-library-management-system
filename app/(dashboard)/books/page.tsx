"use client"

import { useState } from "react"
import {
  BookOpen,
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
import { DeleteBookDialog } from "@/components/books/delete-book-dialog"
import { BookFormDialog } from "@/components/books/book-form-dialog"
import { LendBookDialog } from "@/components/books/lend-book-dialog"
import {
  bookFromFormValues,
  type Book,
  type BookFormValues,
} from "@/lib/books"
import { SEED_BOOKS } from "@/lib/mocks/books"

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
            {totalItems === 1 ? "book" : "books"}
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

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>(SEED_BOOKS)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [languageFilter, setLanguageFilter] = useState("all")
  const [yearFilter, setYearFilter] = useState("all")
  const [formOpen, setFormOpen] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [deletingBook, setDeletingBook] = useState<Book | null>(null)
  const [lendingBook, setLendingBook] = useState<Book | null>(null)
  const toast = useToast()

  const query = search.trim().toLowerCase()
  const languageOptions = Array.from(
    new Set(books.map((book) => book.language).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b))
  const yearOptions = Array.from(
    new Set(
      books
        .map((book) => book.publishedYear)
        .filter((year): year is number => year !== null)
    )
  ).sort((a, b) => b - a)

  const filteredBooks = books.filter((book) => {
    if (languageFilter !== "all" && book.language !== languageFilter) {
      return false
    }
    if (
      yearFilter !== "all" &&
      String(book.publishedYear) !== yearFilter
    ) {
      return false
    }
    if (
      query &&
      !`${book.title} ${book.author} ${book.isbn}`
        .toLowerCase()
        .includes(query)
    ) {
      return false
    }
    return true
  })

  const filtersActive =
    search.trim() !== "" || languageFilter !== "all" || yearFilter !== "all"
  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const visibleBooks = filteredBooks.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  function updateSearch(value: string) {
    setSearch(value)
    setPage(1)
  }

  function resetFilters() {
    setSearch("")
    setLanguageFilter("all")
    setYearFilter("all")
    setPage(1)
  }

  function openCreate() {
    setEditingBook(null)
    setFormKey((key) => key + 1)
    setFormOpen(true)
  }

  function openEdit(book: Book) {
    setEditingBook(book)
    setFormKey((key) => key + 1)
    setFormOpen(true)
  }

  async function handleSubmit(values: BookFormValues) {
    await new Promise((resolve) => setTimeout(resolve, 700))
    const now = new Date().toISOString()
    const fields = bookFromFormValues(values)
    const totalCopies = Number(values.totalCopies)

    setBooks((previous) => {
      if (editingBook === null) {
        return [
          {
            id: crypto.randomUUID(),
            ...fields,
            totalCopies,
            availableCopies: totalCopies,
            createdAt: now,
            updatedAt: now,
          },
          ...previous,
        ]
      }
      return previous.map((book) =>
        book.id === editingBook.id
          ? {
              ...book,
              ...fields,
              totalCopies,
              availableCopies: Math.min(book.availableCopies, totalCopies),
              updatedAt: now,
            }
          : book
      )
    })
    setFormOpen(false)
    toast({
      variant: "success",
      title: editingBook === null ? "Book added" : "Book updated",
      description:
        editingBook === null
          ? `"${values.title}" added to the catalog.`
          : `Changes to "${values.title}" saved.`,
    })
  }

  function handleDelete() {
    if (deletingBook === null) return
    const removed = deletingBook
    setBooks((previous) => previous.filter((book) => book.id !== removed.id))
    setDeletingBook(null)
    toast({
      variant: "success",
      title: "Book deleted",
      description: `"${removed.title}" removed from the catalog.`,
    })
  }

  function handleLend() {
    if (lendingBook === null || lendingBook.availableCopies === 0) return
    const lent = lendingBook
    setBooks((previous) =>
      previous.map((book) =>
        book.id === lent.id
          ? {
              ...book,
              availableCopies: book.availableCopies - 1,
              updatedAt: new Date().toISOString(),
            }
          : book
      )
    )
    setLendingBook(null)
    toast({
      variant: "success",
      title: "Copy lent",
      description: `"${lent.title}" — ${lent.availableCopies - 1} of ${lent.totalCopies} copies available.`,
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Books</h1>
          <p className="text-sm text-text-secondary">
            Manage the catalog: titles, authors, languages, and copies.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus />
          Add book
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:max-w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-secondary" />
          <Input
            value={search}
            onChange={(event) => updateSearch(event.target.value)}
            placeholder="Search by title, author, or ISBN"
            aria-label="Search books"
            className="h-11 rounded-[10px] border-border bg-surface pl-9"
          />
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="relative">
            <select
              value={languageFilter}
              onChange={(event) => {
                setLanguageFilter(event.target.value)
                setPage(1)
              }}
              aria-label="Filter by language"
              className="h-11 appearance-none rounded-[10px] border border-border bg-surface pr-9 pl-3 text-sm text-text-primary focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-hidden"
            >
              <option value="all">All languages</option>
              {languageOptions.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-text-secondary" />
          </div>
          <div className="relative">
            <select
              value={yearFilter}
              onChange={(event) => {
                setYearFilter(event.target.value)
                setPage(1)
              }}
              aria-label="Filter by publication year"
              className="h-11 appearance-none rounded-[10px] border border-border bg-surface pr-9 pl-3 text-sm text-text-primary focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-hidden"
            >
              <option value="all">All years</option>
              {yearOptions.map((year) => (
                <option key={year} value={String(year)}>
                  {year}
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
              <th className="w-[36%] px-5 py-3 text-left text-[12px] font-medium text-text-secondary sm:w-[26%]">
                Title
              </th>
              <th className="w-[25%] px-4 py-3 text-left text-[12px] font-medium text-text-secondary">
                Author
              </th>
              <th className="px-4 py-3 text-left text-[12px] font-medium text-text-secondary">
                Published
              </th>
              <th className="px-4 py-3 text-left text-[12px] font-medium text-text-secondary">
                Language
              </th>
              <th className="px-4 py-3 text-left text-[12px] font-medium text-text-secondary">
                Copies
              </th>
              <th className="w-32 px-5 py-3 text-right text-[12px] font-medium text-text-secondary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {books.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-12 text-center text-sm text-text-secondary"
                >
                  No books yet. Click &quot;Add book&quot; to create the first
                  entry.
                </td>
              </tr>
            ) : filteredBooks.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-12 text-center text-sm text-text-secondary"
                >
                  No books match your search or filters.
                </td>
              </tr>
            ) : (
              visibleBooks.map((book) => (
                <tr
                  key={book.id}
                  className="transition-colors duration-150 hover:bg-muted/50"
                >
                  <td className="px-5 py-3">
                    <span
                      className="block truncate font-medium text-text-primary"
                      title={book.title}
                    >
                      {book.title}
                    </span>
                  </td>
                  <td className="truncate px-4 py-3 text-text-secondary">
                    {book.author}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {book.publishedYear === null ? "—" : book.publishedYear}
                  </td>
                  <td className="truncate px-4 py-3 text-text-secondary">
                    {book.language}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    <span className="text-text-primary tabular-nums">
                      {book.availableCopies}
                    </span>
                    {" / "}
                    <span className="tabular-nums">{book.totalCopies}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={book.availableCopies === 0}
                        onClick={() => setLendingBook(book)}
                        aria-label={`Lend ${book.title}`}
                        title={
                          book.availableCopies === 0
                            ? "No copies available"
                            : "Lend a copy"
                        }
                        className="text-text-secondary hover:text-primary"
                      >
                        <BookOpen />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(book)}
                        aria-label={`Edit ${book.title}`}
                        className="text-text-secondary hover:text-primary"
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingBook(book)}
                        aria-label={`Delete ${book.title}`}
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
        totalItems={filteredBooks.length}
        onPageChange={setPage}
      />

      <BookFormDialog
        key={formKey}
        open={formOpen}
        book={editingBook}
        books={books}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
      />
      <LendBookDialog
        book={lendingBook}
        onOpenChange={(open) => {
          if (!open) setLendingBook(null)
        }}
        onConfirm={handleLend}
      />
      <DeleteBookDialog
        book={deletingBook}
        onOpenChange={(open) => {
          if (!open) setDeletingBook(null)
        }}
        onConfirm={handleDelete}
      />
    </div>
  )
}