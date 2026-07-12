export type AccountBalance = {
	amount?: number
	formatted?: string
}

export type Account = {
	id: number | string
	name: string
	description?: string | null
	color?: string | null
	icon?: string | null
	currency?: string | null
	type?: string | null
	isDefault?: boolean
	balance?: AccountBalance
	[key: string]: unknown
}
