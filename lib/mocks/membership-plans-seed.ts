import type { MembershipPlan } from "@/lib/membership-plans"

export const SEED_MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: "plan-standard",
    name: "Standard",
    description:
      "Full library access for casual readers with a modest borrowing allowance.",
    price: 15000,
    billingTerm: "monthly",
    borrowingLimit: 3,
    loanPeriodDays: 14,
    isActive: true,
    createdAt: "2025-01-10T08:00:00.000Z",
    updatedAt: "2025-01-10T08:00:00.000Z",
  },
  {
    id: "plan-student",
    name: "Student",
    description:
      "Discounted annual plan for students with a focus on study materials.",
    price: 80000,
    billingTerm: "annual",
    borrowingLimit: 2,
    loanPeriodDays: 14,
    isActive: true,
    createdAt: "2025-01-10T08:00:00.000Z",
    updatedAt: "2025-01-10T08:00:00.000Z",
  },
  {
    id: "plan-premium",
    name: "Premium",
    description:
      "Largest borrowing allowance and longest loan periods for the most active readers.",
    price: 250000,
    billingTerm: "annual",
    borrowingLimit: 5,
    loanPeriodDays: 21,
    isActive: true,
    createdAt: "2025-01-10T08:00:00.000Z",
    updatedAt: "2025-01-10T08:00:00.000Z",
  },
]