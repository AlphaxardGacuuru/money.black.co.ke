export type CategoryTotal = {
	amount?: number
	formatted?: string
}

export type Category = {
	id: number | string
	name: string
	description?: string | null
	icon?: string | null
	color?: string | null
	type?: "expense" | "income" | string
	total?: CategoryTotal
	[key: string]: unknown
}
