export type Transaction = {
	id: number | string
	accountId: number | string
	accountName: string
	accountCurrency: string
	accountIcon: string
	accountColor: string
	categoryId: number | string
	categoryName: string
	categoryType: string
	categoryIcon: string
	categoryColor: string
	amount: {
		amount: number
		formatted: string
	}
	currency: string
	notes: string | null
	transactionDateHuman: string
	transactionDateInput: string
	createdAt: string
}

export type TransactionResource = {
	data: Transaction
}

export type TransactionCollection = {
	data: Transaction[]
}

export type TransactionPageProps = {
	transactions: TransactionCollection
}
