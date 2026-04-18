import type { Category } from "@/types/category"

export type OverviewTotals = {
	expense?: number | string
	income?: number | string
	net?: number | string
}

export type Overview = {
	categories: Category[]
	totals: OverviewTotals
}
