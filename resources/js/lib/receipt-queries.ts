import { queryOptions } from "@tanstack/react-query"
import Axios from "@/lib/axios"
import { queryClient } from "@/lib/query-client"
import { index as accountsIndex } from "@/routes/accounts"
import { file, index, show } from "@/routes/api/receipts"
import { index as categoriesIndex } from "@/routes/categories"
import type { Account } from "@/types/account"
import type { Category } from "@/types/category"
import type { Receipt } from "@/types/receipt"

export const receiptKeys = {
	all: ["receipts"] as const,
	list: () => [...receiptKeys.all, "list"] as const,
	detail: (id: string) => [...receiptKeys.all, "detail", id] as const,
	file: (id: string) => [...receiptKeys.all, "file", id] as const,
	accounts: () => [...receiptKeys.all, "accounts"] as const,
	expenseCategories: () => [...receiptKeys.all, "expense-categories"] as const,
}

export type ReceiptFile = { url: string; isPdf: boolean }

/** Copy a receipt's latest state into the list, without the line items the list doesn't need. */
function updateListEntry(receipt: Receipt) {
	queryClient.setQueryData<Receipt[]>(receiptKeys.list(), (receipts) =>
		receipts?.map((cached) => {
			if (cached.id !== receipt.id) {
				return cached
			}

			return {
				...cached,
				...receipt,
				items: undefined,
				transactions: undefined,
				itemsCount: receipt.items?.length ?? cached.itemsCount,
			}
		})
	)
}

/** Store a receipt returned by the API (show, upload, retry, confirm) everywhere it's shown. */
export function cacheReceipt(receipt: Receipt) {
	queryClient.setQueryData(receiptKeys.detail(receipt.id), receipt)
	updateListEntry(receipt)
	queryClient.invalidateQueries({ queryKey: receiptKeys.list() })
}

export function forgetReceipt(id: string) {
	queryClient.removeQueries({ queryKey: receiptKeys.detail(id) })
	queryClient.removeQueries({ queryKey: receiptKeys.file(id) })
	queryClient.setQueryData<Receipt[]>(receiptKeys.list(), (receipts) =>
		receipts?.filter((receipt) => receipt.id !== id)
	)
}

export function receiptListQuery() {
	return queryOptions({
		queryKey: receiptKeys.list(),
		queryFn: () => Axios.get<{ data: Receipt[] }>(index().url).then((response) => response.data.data),
		refetchInterval: (query) =>
			query.state.data?.some((receipt) => receipt.status === "processing") ? 3000 : false,
	})
}

export function receiptQuery(id: string) {
	return queryOptions({
		queryKey: receiptKeys.detail(id),
		queryFn: async () => {
			const receipt = await Axios.get<{ data: Receipt }>(show(id).url).then((response) => response.data.data)

			updateListEntry(receipt)

			return receipt
		},
		// Show what the list already knows while the full receipt loads.
		placeholderData: () =>
			queryClient.getQueryData<Receipt[]>(receiptKeys.list())?.find((receipt) => receipt.id === id),
		refetchInterval: (query) => (query.state.data?.status === "processing" ? 2000 : false),
		retry: false,
	})
}

/**
 * The receipt file, loaded through the API because an <img> tag can't send the
 * bearer token. The file never changes, so it's fetched once per session.
 */
export function receiptFileQuery(id: string) {
	return queryOptions({
		queryKey: receiptKeys.file(id),
		queryFn: () =>
			Axios.get<Blob>(file(id).url, { responseType: "blob" }).then(
				(response): ReceiptFile => ({
					url: URL.createObjectURL(response.data),
					isPdf: response.data.type === "application/pdf",
				})
			),
		staleTime: Infinity,
		gcTime: 10 * 60 * 1000,
		retry: 1,
	})
}

export function receiptAccountsQuery() {
	return queryOptions({
		queryKey: receiptKeys.accounts(),
		queryFn: () => Axios.get<{ data: Account[] }>(accountsIndex().url).then((response) => response.data.data),
		staleTime: 30 * 1000,
	})
}

export function receiptCategoriesQuery() {
	return queryOptions({
		queryKey: receiptKeys.expenseCategories(),
		queryFn: () =>
			Axios.get<{ data: Category[] }>(categoriesIndex().url).then((response) =>
				response.data.data.filter((category) => category.type === "expense")
			),
		staleTime: 30 * 1000,
	})
}

// Free each file's object URL once React Query drops it from the cache.
queryClient.getQueryCache().subscribe((event) => {
	const [scope, kind] = event.query.queryKey

	if (event.type === "removed" && scope === "receipts" && kind === "file") {
		const receiptFile = event.query.state.data as ReceiptFile | undefined

		if (receiptFile) {
			URL.revokeObjectURL(receiptFile.url)
		}
	}
})
