export interface Author {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string | null
  nationality: string
  bio: string
  photoUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface AuthorFormValues {
  firstName: string
  lastName: string
  dateOfBirth: string
  nationality: string
  bio: string
  photoUrl: string
}

export type AuthorFormErrors = Partial<Record<keyof AuthorFormValues, string>>

export function cleanText(value: string): string {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

export function cleanAuthorFormValues(
  values: AuthorFormValues
): AuthorFormValues {
  return {
    firstName: cleanText(values.firstName),
    lastName: cleanText(values.lastName),
    dateOfBirth: values.dateOfBirth.trim(),
    nationality: cleanText(values.nationality),
    bio: cleanText(values.bio),
    photoUrl: values.photoUrl.trim(),
  }
}

export function authorToFormValues(author: Author | null): AuthorFormValues {
  if (!author) {
    return {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      nationality: "",
      bio: "",
      photoUrl: "",
    }
  }

  return {
    firstName: author.firstName,
    lastName: author.lastName,
    dateOfBirth: author.dateOfBirth ?? "",
    nationality: author.nationality,
    bio: author.bio,
    photoUrl: author.photoUrl ?? "",
  }
}

export function authorFromFormValues(
  values: AuthorFormValues
): Pick<
  Author,
  | "firstName"
  | "lastName"
  | "dateOfBirth"
  | "nationality"
  | "bio"
  | "photoUrl"
> {
  return {
    firstName: values.firstName,
    lastName: values.lastName,
    dateOfBirth: values.dateOfBirth === "" ? null : values.dateOfBirth,
    nationality: values.nationality,
    bio: values.bio,
    photoUrl: values.photoUrl === "" ? null : values.photoUrl,
  }
}

export function findDuplicateAuthor(
  authors: Author[],
  firstName: string,
  lastName: string,
  ignoreId?: string
): Author | undefined {
  const first = cleanText(firstName).toLowerCase()
  const last = cleanText(lastName).toLowerCase()
  if (!first || !last) return undefined
  return authors.find(
    (author) =>
      cleanText(author.firstName).toLowerCase() === first &&
      cleanText(author.lastName).toLowerCase() === last &&
      author.id !== ignoreId
  )
}

export function validateAuthor(values: AuthorFormValues): AuthorFormErrors {
  const errors: AuthorFormErrors = {}

  if (!values.firstName) {
    errors.firstName = "First name is required."
  } else if (!/^[\p{L}\s'’-]+$/u.test(values.firstName)) {
    errors.firstName = "Letters and spaces only."
  } else if (values.firstName.length > 80) {
    errors.firstName = "80 characters max."
  }

  if (!values.lastName) {
    errors.lastName = "Last name is required."
  } else if (!/^[\p{L}\s'’-]+$/u.test(values.lastName)) {
    errors.lastName = "Letters and spaces only."
  } else if (values.lastName.length > 80) {
    errors.lastName = "80 characters max."
  }

  const dateOfBirth = values.dateOfBirth.trim()
  if (dateOfBirth) {
    const parsed = new Date(`${dateOfBirth}T00:00:00.000Z`)
    if (Number.isNaN(parsed.getTime())) {
      errors.dateOfBirth = "Enter a valid date."
    } else if (parsed.getTime() > Date.now()) {
      errors.dateOfBirth = "Date of birth can't be in the future."
    }
  }

  if (!values.nationality) {
    errors.nationality = "Nationality is required."
  } else if (!/^[\p{L}\s'’-]+$/u.test(values.nationality)) {
    errors.nationality = "Letters and spaces only."
  } else if (values.nationality.length > 60) {
    errors.nationality = "60 characters max."
  }

  if (values.bio.length > 2000) {
    errors.bio = "2000 characters max."
  }

  if (
    values.photoUrl &&
    !/^(https?:\/\/\S+|data:image\/[^;]+;base64,)/i.test(values.photoUrl)
  ) {
    errors.photoUrl = "Photo must be an image file."
  }

  return errors
}

export function isAuthorFormValid(errors: AuthorFormErrors) {
  return Object.keys(errors).length === 0
}
