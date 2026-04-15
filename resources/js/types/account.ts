export type Account = {
	id: number | string
	name: string
	icon: string
	color: string
	currency: string
	balance: {
		amount: number
		formatted: string
	}
	type: string
	description: string
	isDefault: boolean
}

export type AccountResource = {
	data: Account
}

export type AccountCollection = {
	data: Account[]
}

export type AccountPageProps = {
	accounts: AccountCollection
}
