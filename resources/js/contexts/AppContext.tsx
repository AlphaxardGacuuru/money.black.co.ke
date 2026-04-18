import type { AxiosError } from "axios"
import { isCancel } from "axios"
import { createContext, useContext, useEffect, useState } from "react"
import type { ChangeEvent } from "react"
import type { Account } from "@/types/account"
import type { Transaction } from "@/types/transaction"
import type { Category } from "@/types/category"
import type { DateFilterParams } from "@/types/date-filter"
import Axios from "@/lib/axios"
import type {
	AppContextValue,
	AppProviderProps,
	AuthState,
	ErrorResponse,
	FormError,
	PaginatedList,
	PageState,
} from "../types/app-context"

const DEFAULT_AUTH: AuthState = {
	id: 0,
	name: "Guest",
	username: "@guest",
	avatar: "/storage/avatars/male-avatar.png",
}

const DEFAULT_DATE_FILTERS: DateFilterParams = {
	filter: "all_time",
	date: "",
	startDate: "",
	endDate: "",
}

const DATE_FILTERS_STORAGE_KEY = "dateFilters"

const readJsonFromLocalStorage = <T,>(key: string, fallback: T): T => {
	if (typeof window === "undefined") {
		return fallback
	}

	try {
		const value = window.localStorage.getItem(key)

		if (!value) {
			return fallback
		}

		return JSON.parse(value) as T
	} catch {
		return fallback
	}
}

const AppContext = createContext<AppContextValue | undefined>(undefined)

export const useApp = (): AppContextValue => {
	const context = useContext(AppContext)

	if (!context) {
		throw new Error("useApp must be used within AppProvider")
	}

	return context
}

export const AppProvider = ({ children }: AppProviderProps) => {
	const [messages, setMessages] = useState<string[]>([])
	const [errors, setErrors] = useState<string[]>([])
	const [formErrors, setFormErrors] = useState<FormError[]>([])
	const [login, setLogin] = useState<string | null>(null)
	const [auth, setAuth] = useState<AuthState>(() =>
		readJsonFromLocalStorage<AuthState>("auth", DEFAULT_AUTH)
	)
	const [headerMenu, setHeaderMenu] = useState<string | null>(null)
	const [adminMenu, setAdminMenu] = useState<string>(() => {
		if (window.innerWidth <= 768) {
			return ""
		}

		return "left-open"
	})
	const [accounts, setAccounts] = useState<Account[]>([])
	const [categories, setCategories] = useState<Category[]>([])
	const [transactions, setTransactions] = useState<Transaction[]>([])

	const [page, setPage] = useState<PageState>({ name: "/", path: [] })
	const [loadingItems, setLoadingItems] = useState(0)
	const [downloadLink, setDownloadLink] = useState<string | null>(null)
	const [downloadLinkText, setDownloadLinkText] = useState("")
	const [dateFilters, setDateFilters] = useState<DateFilterParams>(() =>
		readJsonFromLocalStorage<DateFilterParams>(
			DATE_FILTERS_STORAGE_KEY,
			DEFAULT_DATE_FILTERS
		)
	)

	const getLocalStorage = <T,>(key: string, fallback: T): T => {
		return readJsonFromLocalStorage<T>(key, fallback)
	}

	const getNormalLocalStorage = (key: string): string | null => {
		if (typeof window === "undefined") {
			return null
		}

		return window.localStorage.getItem(key)
	}

	const getLocalStorageAuth = (key = "auth"): AuthState => {
		return getLocalStorage<AuthState>(key, DEFAULT_AUTH)
	}

	const setLocalStorage = (key: string, value: unknown): void => {
		if (typeof window === "undefined") {
			return
		}

		window.localStorage.setItem(key, JSON.stringify(value))
	}

	useEffect(() => {
		setLocalStorage(DATE_FILTERS_STORAGE_KEY, {
			filter: dateFilters.filter ?? DEFAULT_DATE_FILTERS.filter,
			date: dateFilters.date ?? DEFAULT_DATE_FILTERS.date,
			startDate: dateFilters.startDate ?? DEFAULT_DATE_FILTERS.startDate,
			endDate: dateFilters.endDate ?? DEFAULT_DATE_FILTERS.endDate,
		})
	}, [dateFilters])

	const withLoading = (
		endpoint: string,
		fn: () => Promise<void>
	): Promise<void> => {
		const shouldTrack = endpoint !== "notifications"

		if (shouldTrack) {
			setLoadingItems((prev) => prev + 1)
		}

		return fn().finally(() => {
			if (shouldTrack) {
				setLoadingItems((prev_1) => Math.max(0, prev_1 - 1))
			}
		})
	}

	const get: AppContextValue["get"] = (
		endpoint,
		setState,
		storage = null,
		shouldSetErrors = true,
		controller
	) => {
		return withLoading(endpoint, () =>
			Axios.get(`/api/${endpoint}`, {
				signal: controller?.signal,
			})
				.then((response) => {
					const data = response.data?.data ?? []
					setState(data)

					if (storage) {
						setLocalStorage(storage, data)
					}
				})
				.catch((error) => {
					if (isCancel(error)) {
						return
					}

					if (shouldSetErrors) {
						setErrors([`Failed to fetch ${endpoint.split("?")[0]}`])
					}
				})
		)
	}

	const getPaginated: AppContextValue["getPaginated"] = (
		endpoint,
		setState,
		storage = null,
		shouldSetErrors = true,
		controller
	) => {
		return withLoading(endpoint, () =>
			Axios.get(`/api/${endpoint}`, {
				signal: controller?.signal,
			})
				.then((response) => {
					const data = response.data ?? []
					setState(data)

					if (storage) {
						setLocalStorage(storage, data)
					}
				})
				.catch(() => {
					if (shouldSetErrors) {
						setErrors([`Failed to fetch ${endpoint.split("?")[0]}`])
					}
				})
		)
	}

	const iterator = (key: number, list: PaginatedList): number => {
		return key + 1 + list.meta.per_page * (list.meta.current_page - 1)
	}

	const getErrors = (
		err: AxiosError<ErrorResponse>,
		includeMessage = false
	): void => {
		const validationErrors = err.response?.data?.errors ?? {}

		const errorList: string[] = []
		const keyedErrors: FormError[] = []

		for (const [field, message] of Object.entries(validationErrors)) {
			const messages = Array.isArray(message) ? message : [message]
			errorList.push(...messages)
			keyedErrors.push({ field, message: messages })
		}

		if (includeMessage && err.response?.data?.message) {
			errorList.push(err.response.data.message)
		}

		setErrors(errorList)
		setFormErrors(keyedErrors)
	}

	const getFieldError = (value: unknown): string | undefined => {
		if (typeof value === "string") {
			return value
		}

		if (Array.isArray(value) && typeof value[0] === "string") {
			return value[0]
		}

		return undefined
	}

	const formatToCommas = (event: ChangeEvent<HTMLInputElement>): string => {
		let value = event.target.value.toString().replace(/[^0-9.]/g, "")
		value = Number(value).toString()
		event.target.value = Number(value || 0).toLocaleString("en-US")

		return event.target.value.replace(/,/g, "")
	}

	const value: AppContextValue = {
		messages,
		setMessages,
		errors,
		setErrors,
		formErrors,
		setFormErrors,
		login,
		setLogin,
		auth,
		setAuth,
		headerMenu,
		setHeaderMenu,
		adminMenu,
		setAdminMenu,
		accounts,
		setAccounts,
		categories,
		setCategories,
		transactions,
		setTransactions,
		page,
		setPage,
		loadingItems,
		setLoadingItems,
		downloadLink,
		setDownloadLink,
		downloadLinkText,
		setDownloadLinkText,
		get,
		getPaginated,
		getLocalStorage,
		getNormalLocalStorage,
		getLocalStorageAuth,
		setLocalStorage,
		iterator,
		getErrors,
		getFieldError,
		formatToCommas,
		dateFilters,
		setDateFilters,
	}

	return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
