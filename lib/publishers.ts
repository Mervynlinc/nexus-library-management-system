export interface Publisher {
  id: string
  name: string
  address: string
  country: string
  website: string | null
  contactEmail: string
  contactPhone: string
  createdAt: string
  updatedAt: string
}

export interface PublisherFormValues {
  name: string
  address: string
  country: string
  website: string
  contactEmail: string
  contactPhone: string
}

export type PublisherFormErrors = Partial<
  Record<keyof PublisherFormValues, string>
>

export function cleanText(value: string): string {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

export function cleanPublisherFormValues(
  values: PublisherFormValues
): PublisherFormValues {
  return {
    name: cleanText(values.name),
    address: cleanText(values.address),
    country: cleanText(values.country),
    website: values.website.trim(),
    contactEmail: values.contactEmail.trim(),
    contactPhone: values.contactPhone.trim(),
  }
}

export function publisherToFormValues(
  publisher: Publisher | null
): PublisherFormValues {
  if (!publisher) {
    return {
      name: "",
      address: "",
      country: "",
      website: "",
      contactEmail: "",
      contactPhone: "",
    }
  }

  return {
    name: publisher.name,
    address: publisher.address,
    country: publisher.country,
    website: publisher.website ?? "",
    contactEmail: publisher.contactEmail,
    contactPhone: publisher.contactPhone,
  }
}

export function publisherFromFormValues(
  values: PublisherFormValues
): Pick<
  Publisher,
  "name" | "address" | "country" | "website" | "contactEmail" | "contactPhone"
> {
  return {
    name: values.name,
    address: values.address,
    country: values.country,
    website: values.website === "" ? null : values.website,
    contactEmail: values.contactEmail,
    contactPhone: values.contactPhone,
  }
}

export function findDuplicatePublisher(
  publishers: Publisher[],
  name: string,
  ignoreId?: string
): Publisher | undefined {
  const target = cleanText(name).toLowerCase()
  if (!target) return undefined
  return publishers.find(
    (publisher) =>
      cleanText(publisher.name).toLowerCase() === target &&
      publisher.id !== ignoreId
  )
}

export function validatePublisher(
  values: PublisherFormValues
): PublisherFormErrors {
  const errors: PublisherFormErrors = {}

  if (!values.name) {
    errors.name = "Publisher name is required."
  } else if (values.name.length > 150) {
    errors.name = "150 characters max."
  }

  if (!values.address) {
    errors.address = "Address is required."
  } else if (values.address.length > 250) {
    errors.address = "250 characters max."
  }

  if (!values.country) {
    errors.country = "Country is required."
  } else if (!/^[\p{L}\s'’-]+$/u.test(values.country)) {
    errors.country = "Letters and spaces only."
  } else if (values.country.length > 80) {
    errors.country = "80 characters max."
  }

  if (values.website && !/^https?:\/\/\S+$/i.test(values.website)) {
    errors.website = "Enter a valid URL starting with http:// or https://."
  } else if (values.website && values.website.length > 250) {
    errors.website = "250 characters max."
  }

  if (!values.contactEmail) {
    errors.contactEmail = "Contact email is required."
  } else if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(values.contactEmail)
  ) {
    errors.contactEmail = "Enter a valid email address."
  } else if (values.contactEmail.length > 150) {
    errors.contactEmail = "150 characters max."
  }

  if (!values.contactPhone) {
    errors.contactPhone = "Contact phone is required."
  } else if (!/^[\d\s()+\-]{7,30}$/.test(values.contactPhone)) {
    errors.contactPhone = "Enter a valid phone number."
  }

  return errors
}

export function isPublisherFormValid(errors: PublisherFormErrors) {
  return Object.keys(errors).length === 0
}
