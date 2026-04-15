export type Category = {
	id: number | string
	name: string
	color?: string | null
	icon?: string | null
	type?: string | null
	currency?: string | null
	total?: number | string | null
}

export type Account = {
	id: number | string
	name: string
	icon?: string | null
	color?: string | null
	currency?: string | null
	isDefault?: boolean
}

export type PaginatedCategories = {
	data?: Category[]
}

export type PaginatedAccounts = {
	data?: Account[]
}

export type CategoriesPageProps = {
	categories?: Category[] | PaginatedCategories
	accounts?: Account[] | PaginatedAccounts
}
