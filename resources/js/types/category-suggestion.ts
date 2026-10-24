export type StarterCategory = {
	name: string
	type: "expense" | "income"
	icon: string
	color: string
	recommended: boolean
}

export type CategorySuggestion = {
	id: string
	action: "add" | "rename"
	name: string
	type: "expense" | "income"
	icon: string
	color: string
	reason: string | null
	categoryId: string | null
	currentName: string | null
	period: string
}
