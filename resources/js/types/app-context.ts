import type { AxiosError } from "axios"
import type { ChangeEvent, Dispatch, ReactNode, SetStateAction } from "react"
import type { User } from "@/types"
import type { Account } from "@/types/account"
import type { Category } from "@/types/category"
import type { OverviewState } from "@/types/overview"
import type { Transaction } from "@/types/transaction"
import type { DateFilterParams } from "@/types/date-filter"

export type FormError = {
	field: string
	message: string[]
}

export type PageState = {
	name: string
	path: string[]
}

export type ListMeta = {
	per_page: number
	current_page: number
}

export type PaginatedList = {
	meta: ListMeta
}

export type ErrorResponse = {
	errors?: Record<string, string[] | string>
	message?: string
}

export type RequestController = {
	signal?: AbortSignal
}

export type AppContextValue = {
	messages: string[]
	setMessages: Dispatch<SetStateAction<string[]>>
	errors: string[]
	setErrors: Dispatch<SetStateAction<string[]>>
	formErrors: FormError[]
	setFormErrors: Dispatch<SetStateAction<FormError[]>>
	login: string | null
	setLogin: Dispatch<SetStateAction<string | null>>
	auth: User | undefined
	headerMenu: string | null
	setHeaderMenu: Dispatch<SetStateAction<string | null>>
	adminMenu: string
	setAdminMenu: Dispatch<SetStateAction<string>>
	accounts: Account[]
	setAccounts: Dispatch<SetStateAction<Account[]>>
	categories: Category[]
	setCategories: Dispatch<SetStateAction<Category[]>>
	transactions: Transaction[]
	setTransactions: Dispatch<SetStateAction<Transaction[]>>
	dateFilters: DateFilterParams
	setDateFilters: Dispatch<SetStateAction<DateFilterParams>>
	overview: OverviewState
	setOverview: Dispatch<SetStateAction<OverviewState>>
	page: PageState
	setPage: Dispatch<SetStateAction<PageState>>
	loadingItems: number
	setLoadingItems: Dispatch<SetStateAction<number>>
	downloadLink: string | null
	setDownloadLink: Dispatch<SetStateAction<string | null>>
	downloadLinkText: string
	setDownloadLinkText: Dispatch<SetStateAction<string>>
	get: <T>(
		endpoint: string,
		setState: Dispatch<SetStateAction<T>>,
		storage?: string | null,
		shouldSetErrors?: boolean,
		controller?: RequestController
	) => Promise<void>
	getPaginated: <T>(
		endpoint: string,
		setState: Dispatch<SetStateAction<T>>,
		storage?: string | null,
		shouldSetErrors?: boolean,
		controller?: RequestController
	) => Promise<void>
	getLocalStorage: <T>(key: string, fallback: T) => T
	setLocalStorage: (key: string, value: unknown) => void
	iterator: (key: number, list: PaginatedList) => number
	getErrors: (err: AxiosError<ErrorResponse>, includeMessage?: boolean) => void
	getFieldError: (value: unknown) => string | undefined
	memberInitials: (name: string) => string
	formatToCommas: (event: ChangeEvent<HTMLInputElement>) => string
}

export type AppProviderProps = {
	children: ReactNode
}
