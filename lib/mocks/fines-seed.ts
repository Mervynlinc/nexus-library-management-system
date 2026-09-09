import { finesFromOverdueLoans } from "@/lib/fines"
import { SEED_LOANS } from "@/lib/mocks/loans-seed"

export const SEED_FINES = finesFromOverdueLoans(SEED_LOANS)