import type { Category } from "@/types/category"

export type OverviewTotals = {
	expense?: number
	income?: number
	net?: number
	[key: string]: number | undefined
}

export type OverviewState = {
	categories: Category[]
	totals: OverviewTotals
}
