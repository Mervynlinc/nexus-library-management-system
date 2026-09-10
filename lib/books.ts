export interface Publisher {
  id: string
  name: string
}

export interface Book {
  id: string
  title: string
  author: string
  isbn: string
  publishedYear: number | null
  genre: string
  language: string
  publisherId: string
  edition: string
  totalCopies: number
  availableCopies: number
  createdAt: string
  updatedAt: string
}

export interface BookFormValues {
  title: string
  author: string
  isbn: string
  publishedYear: string
  genre: string
  language: string
  publisherId: string
  edition: string
  totalCopies: string
}

export type BookFormErrors = Partial<Record<keyof BookFormValues, string>>

export function normalizeIsbn(value: string): string {
  return value.replace(/[\s-]/g, "").toUpperCase()
}

export function cleanText(value: string): string {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

export function toDigits(value: string): string {
  return value.replace(/\D/g, "")
}

export function cleanBookFormValues(
  values: BookFormValues
): BookFormValues {
  return {
    title: cleanText(values.title),
    author: cleanText(values.author),
    isbn: normalizeIsbn(values.isbn),
    publishedYear: values.publishedYear.trim(),
    genre: cleanText(values.genre),
    language: cleanText(values.language),
    publisherId: values.publisherId.trim(),
    edition: cleanText(values.edition),
    totalCopies: values.totalCopies.trim(),
  }
}

export function bookToFormValues(book: Book | null): BookFormValues {
  if (!book) {
    return {
      title: "",
      author: "",
      isbn: "",
      publishedYear: "",
      genre: "",
      language: "",
      publisherId: "",
      edition: "",
      totalCopies: "",
    }
  }

  return {
    title: book.title,
    author: book.author,
    isbn: book.isbn,
    publishedYear:
      book.publishedYear === null ? "" : String(book.publishedYear),
    genre: book.genre,
    language: book.language,
    publisherId: book.publisherId,
    edition: book.edition,
    totalCopies: String(book.totalCopies),
  }
}

export function bookFromFormValues(
  values: BookFormValues
): Pick<
  Book,
  | "title"
  | "author"
  | "isbn"
  | "publishedYear"
  | "genre"
  | "language"
  | "publisherId"
  | "edition"
> {
  return {
    title: values.title,
    author: values.author,
    isbn: values.isbn,
    publishedYear:
      values.publishedYear === "" ? null : Number(values.publishedYear),
    genre: values.genre,
    language: values.language,
    publisherId: values.publisherId,
    edition: values.edition,
  }
}

export function findDuplicateBook(
  books: Book[],
  isbn: string,
  ignoreId?: string
): Book | undefined {
  const target = normalizeIsbn(isbn)
  if (!target) return undefined
  return books.find(
    (book) => normalizeIsbn(book.isbn) === target && book.id !== ignoreId
  )
}

export function validateBook(values: BookFormValues): BookFormErrors {
  const errors: BookFormErrors = {}

  if (!values.title) {
    errors.title = "Title is required."
  } else if (values.title.length > 500) {
    errors.title = "500 characters max."
  }

  if (!values.author) {
    errors.author = "Author is required."
  } else if (values.author.length > 200) {
    errors.author = "200 characters max."
  }

  const isbn = normalizeIsbn(values.isbn)
  if (!isbn) {
    errors.isbn = "ISBN required."
  } else if (!(/^\d{9}[\dX]$/i.test(isbn) || /^\d{13}$/.test(isbn))) {
    errors.isbn = "Invalid ISBN."
  }

  if (!values.publishedYear) {
    errors.publishedYear = "Year is required."
  } else if (!/^\d{4}$/.test(values.publishedYear)) {
    errors.publishedYear = "Enter a 4-digit year."
  } else {
    const numericYear = Number(values.publishedYear)
    const currentYear = new Date().getFullYear()
    if (numericYear < 1000 || numericYear > currentYear + 1) {
      errors.publishedYear = "Year looks out of range."
    }
  }

  if (!values.genre) {
    errors.genre = "Genre is required."
  } else if (!/^[\p{L}\p{N}\s'’&/.,()\-]+$/u.test(values.genre)) {
    errors.genre = "Letters, numbers, and basic punctuation."
  } else if (values.genre.length > 60) {
    errors.genre = "60 characters max."
  }

  if (!values.language) {
    errors.language = "Language is required."
  } else if (!/^[\p{L}\s'’-]+$/u.test(values.language)) {
    errors.language = "Letters and spaces only."
  } else if (values.language.length > 50) {
    errors.language = "50 characters max."
  }

  if (!values.publisherId) {
    errors.publisherId = "Select a publisher."
  }

  if (values.edition.length > 40) {
    errors.edition = "40 characters max."
  }

  if (!values.totalCopies) {
    errors.totalCopies = "Copies required."
  } else if (!/^\d+$/.test(values.totalCopies)) {
    errors.totalCopies = "Whole number."
  } else if (Number(values.totalCopies) > 100000) {
    errors.totalCopies = "Too many copies."
  }

  return errors
}

export function isBookFormValid(errors: BookFormErrors) {
  return Object.keys(errors).length === 0
}