export type TransactionAmount = {
	amount: number
	formatted?: string
}

export type Transaction = {
	id: number | string
	amount: TransactionAmount
	notes?: string | null
	currency?: string
	transactionDate?: string | null
	transactionDateInput?: string
	transactionDateHuman?: string
	accountId: number | string
	accountName?: string
	accountColor?: string | null
	accountIcon?: string | null
	categoryId: number | string
	categoryName?: string
	categoryType?: "expense" | "income" | string
	categoryColor?: string | null
	categoryIcon?: string | null
	createdAtFormatted: string
	[key: string]: unknown
}
