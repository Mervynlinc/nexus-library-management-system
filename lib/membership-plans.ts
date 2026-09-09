export type BillingTerm = "monthly" | "annual"

export interface MembershipPlan {
  id: string
  name: string
  description: string
  price: number
  billingTerm: BillingTerm
  borrowingLimit: number
  loanPeriodDays: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface MembershipPlanFormValues {
  name: string
  description: string
  price: string
  billingTerm: BillingTerm
  borrowingLimit: string
  loanPeriodDays: string
  isActive: boolean
}

export type MembershipPlanFormErrors = Partial<
  Record<keyof MembershipPlanFormValues, string>
>

export const BILLING_TERM_OPTIONS: { value: BillingTerm; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "annual", label: "Annual" },
]

export function cleanText(value: string): string {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

export function billingTermText(term: BillingTerm): string {
  return term === "monthly" ? "per month" : "per year"
}

export function cleanMembershipPlanFormValues(
  values: MembershipPlanFormValues
): MembershipPlanFormValues {
  return {
    name: cleanText(values.name),
    description: cleanText(values.description),
    price: values.price.replace(/[\u0000-\u001f\u007f]/g, "").trim(),
    billingTerm: values.billingTerm,
    borrowingLimit: values.borrowingLimit
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .trim(),
    loanPeriodDays: values.loanPeriodDays
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .trim(),
    isActive: values.isActive,
  }
}

export function membershipPlanToFormValues(
  plan: MembershipPlan | null
): MembershipPlanFormValues {
  if (!plan) {
    return {
      name: "",
      description: "",
      price: "",
      billingTerm: "monthly",
      borrowingLimit: "3",
      loanPeriodDays: "14",
      isActive: true,
    }
  }

  return {
    name: plan.name,
    description: plan.description,
    price: String(plan.price),
    billingTerm: plan.billingTerm,
    borrowingLimit: String(plan.borrowingLimit),
    loanPeriodDays: String(plan.loanPeriodDays),
    isActive: plan.isActive,
  }
}

export function membershipPlanFromFormValues(
  values: MembershipPlanFormValues
): Pick<
  MembershipPlan,
  | "name"
  | "description"
  | "price"
  | "billingTerm"
  | "borrowingLimit"
  | "loanPeriodDays"
  | "isActive"
> {
  return {
    name: values.name,
    description: values.description,
    price: Number(values.price),
    billingTerm: values.billingTerm,
    borrowingLimit: Number(values.borrowingLimit),
    loanPeriodDays: Number(values.loanPeriodDays),
    isActive: values.isActive,
  }
}

export function findDuplicateMembershipPlan(
  plans: MembershipPlan[],
  name: string,
  ignoreId?: string
): MembershipPlan | undefined {
  const target = cleanText(name).toLowerCase()
  if (!target) return undefined
  return plans.find(
    (plan) =>
      cleanText(plan.name).toLowerCase() === target && plan.id !== ignoreId
  )
}

export function validateMembershipPlan(
  values: MembershipPlanFormValues
): MembershipPlanFormErrors {
  const errors: MembershipPlanFormErrors = {}

  if (!values.name) {
    errors.name = "Plan name is required."
  } else if (values.name.length > 80) {
    errors.name = "80 characters max."
  }

  if (values.description.length > 250) {
    errors.description = "250 characters max."
  }

  if (!values.price) {
    errors.price = "Price is required."
  } else {
    const price = Number(values.price)
    if (!Number.isFinite(price) || price <= 0 || !Number.isInteger(price)) {
      errors.price = "Enter a whole number greater than zero."
    } else if (price > 50_000_000) {
      errors.price = "50,000,000 max."
    }
  }

  const billingTermValid = BILLING_TERM_OPTIONS.some(
    (option) => option.value === values.billingTerm
  )
  if (!billingTermValid) {
    errors.billingTerm = "Select a billing term."
  }

  if (!values.borrowingLimit) {
    errors.borrowingLimit = "Borrowing limit is required."
  } else {
    const limit = Number(values.borrowingLimit)
    if (!Number.isInteger(limit) || limit < 1) {
      errors.borrowingLimit = "Enter at least 1."
    } else if (limit > 50) {
      errors.borrowingLimit = "50 max."
    }
  }

  if (!values.loanPeriodDays) {
    errors.loanPeriodDays = "Loan period is required."
  } else {
    const days = Number(values.loanPeriodDays)
    if (!Number.isInteger(days) || days < 1) {
      errors.loanPeriodDays = "Enter at least 1 day."
    } else if (days > 365) {
      errors.loanPeriodDays = "365 max."
    }
  }

  return errors
}

export function isMembershipPlanFormValid(
  errors: MembershipPlanFormErrors
): boolean {
  return Object.keys(errors).length === 0
}