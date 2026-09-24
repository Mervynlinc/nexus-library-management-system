import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Removes control characters and collapses/collapses whitespace before
 * validation. Every form across the app routes its text inputs through this
 * helper (lib/{authors,books,members,publishers,membership-plans}.ts), so
 * padding spaces can't defeat required-field checks and stray tab/newline
 * bytes never reach the data layer. Single shared implementation instead of
 * per-module copies -> one definition to reason about.
 */
export function cleanText(value: string): string {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

export function formatUGX(amount: number): string {
  return `UGX ${amount.toLocaleString("en-US")}`
}
