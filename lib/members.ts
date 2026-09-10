export interface MembershipPlan {
  id: string
  name: string
}

export interface Member {
  id: string
  memberNumber: string
  firstName: string
  lastName: string
  email: string
  phone: string
  nationality: string
  dateOfBirth: string | null
  photoUrl: string | null
  membershipId: string
  createdAt: string
  updatedAt: string
}

export interface MemberFormValues {
  memberNumber: string
  firstName: string
  lastName: string
  email: string
  phone: string
  nationality: string
  dateOfBirth: string
  photoUrl: string
  membershipId: string
}

export type MemberFormErrors = Partial<Record<keyof MemberFormValues, string>>

export function cleanText(value: string): string {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

export function generateMemberNumber(members: Member[]): string {
  const highest = members.reduce((max, member) => {
    const match = /^MBR-(\d+)$/.exec(member.memberNumber)
    if (!match) return max
    return Math.max(max, Number(match[1]))
  }, 0)
  return `MBR-${String(highest + 1).padStart(4, "0")}`
}

export function cleanMemberFormValues(
  values: MemberFormValues
): MemberFormValues {
  return {
    memberNumber: values.memberNumber.trim(),
    firstName: cleanText(values.firstName),
    lastName: cleanText(values.lastName),
    email: normalizeEmail(values.email),
    phone: values.phone.replace(/[\u0000-\u001f\u007f]/g, "").trim(),
    nationality: cleanText(values.nationality),
    dateOfBirth: values.dateOfBirth.trim(),
    photoUrl: values.photoUrl.trim(),
    membershipId: values.membershipId.trim(),
  }
}

export function memberToFormValues(
  member: Member | null,
  nextMemberNumber = ""
): MemberFormValues {
  if (member) {
return {
    memberNumber: member.memberNumber,
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    phone: member.phone,
    nationality: member.nationality,
    dateOfBirth: member.dateOfBirth ?? "",
    photoUrl: member.photoUrl ?? "",
    membershipId: member.membershipId,
  }
  }

  return {
    memberNumber: nextMemberNumber,
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    nationality: "",
    dateOfBirth: "",
    photoUrl: "",
    membershipId: "",
  }
}

export function memberFromFormValues(
  values: MemberFormValues
): Pick<
  Member,
  | "firstName"
  | "lastName"
  | "email"
  | "phone"
  | "nationality"
  | "dateOfBirth"
  | "photoUrl"
  | "membershipId"
> {
  return {
    firstName: values.firstName,
    lastName: values.lastName,
    email: values.email,
    phone: values.phone,
    nationality: values.nationality,
    dateOfBirth: values.dateOfBirth === "" ? null : values.dateOfBirth,
    photoUrl: values.photoUrl === "" ? null : values.photoUrl,
    membershipId: values.membershipId,
  }
}

export function findDuplicateMember(
  members: Member[],
  email: string,
  ignoreId?: string
): Member | undefined {
  const target = normalizeEmail(email)
  if (!target) return undefined
  return members.find(
    (member) =>
      normalizeEmail(member.email) === target && member.id !== ignoreId
  )
}

export function validateMember(values: MemberFormValues): MemberFormErrors {
  const errors: MemberFormErrors = {}

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

  const email = normalizeEmail(values.email)
  if (!email) {
    errors.email = "Email is required."
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    errors.email = "Enter a valid email address."
  } else if (email.length > 254) {
    errors.email = "254 characters max."
  }

  const phone = values.phone.replace(/[\u0000-\u001f\u007f]/g, "").trim()
  if (!phone) {
    errors.phone = "Phone is required."
  } else if (!/^\+?[\d\s().-]+$/.test(phone)) {
    errors.phone = "Digits, spaces, and basic punctuation."
  } else if (phone.length > 30) {
    errors.phone = "30 characters max."
  }

  if (!values.nationality) {
    errors.nationality = "Nationality is required."
  } else if (!/^[\p{L}\s'’-]+$/u.test(values.nationality)) {
    errors.nationality = "Letters and spaces only."
  } else if (values.nationality.length > 60) {
    errors.nationality = "60 characters max."
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

  if (
    values.photoUrl &&
    !/^(https?:\/\/\S+|data:image\/[^;]+;base64,)/i.test(values.photoUrl)
  ) {
    errors.photoUrl = "Photo must be an image file."
  }

  if (!values.membershipId) {
    errors.membershipId = "Select a membership plan."
  }

  return errors
}

export function isMemberFormValid(errors: MemberFormErrors) {
  return Object.keys(errors).length === 0
}