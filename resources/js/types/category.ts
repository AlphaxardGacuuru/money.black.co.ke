export type Category = {
	id: number | string
	name: string
	color?: string | null
	icon?: string | null
	type?: string | null
	total: {
		amount: number
		formatted: string
	}
}

export type CategoryResource = {
	data: Category
}

export type CategoryCollection = {
	data: Category[]
}

export type CategoryPageProps = {
	categories: CategoryCollection
}
