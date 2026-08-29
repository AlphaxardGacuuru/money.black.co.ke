import { Link } from "@/components/ui/link"
import { Head } from "@/lib/spa"
import { ArrowUpLeft, Plus, ArrowUpDown } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { buildFilterQuery } from "@/lib/date-filter"
import AddTransactionSheet from "@/components/add-transaction-sheet"
import LucideIconDisplay from "@/components/lucide-icon-display"
import type { Category } from "@/types/category"
import type { Transaction } from "@/types/transaction"

import { useInitials } from "@/hooks/use-initials"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PlaceholderPattern } from "@/components/ui/placeholder-pattern"
import { useApp } from "@/contexts/AppContext"
import Axios from "@/lib/axios"
import DateFilterSheet from "@/components/categories/date-filter-sheet"
import SwipeableDateView from "@/components/swipeable-date-view"
import { useSidebar } from "@/components/ui/sidebar"
import TransactionFilterSheet from "@/components/transactions/transaction-filter-sheet"
import type { TransactionFilters } from "@/components/transactions/transaction-filter-sheet"

type SheetCategory = Pick<Category, "id" | "name" | "icon" | "color">

type TransactionPeriodSummary = {
	startingBalance: number
	endingBalance: number
	total: number
	currency: string
}

const DEFAULT_TRANSACTION_PERIOD_SUMMARY: TransactionPeriodSummary = {
	startingBalance: 0,
	endingBalance: 0,
	total: 0,
	currency: "KES",
}

function buildTransactionFilterQuery(filters: TransactionFilters): string {
	const params = new URLSearchParams()

	if (filters.accountId) {
		params.set("accountId", filters.accountId)
	}

	if (filters.categoryId) {
		params.set("categoryId", filters.categoryId)
	}

	if (filters.notes) {
		params.set("notes", filters.notes)
	}

	if (filters.amount) {
		params.set("amount", filters.amount)
	}

	return params.toString()
}

export default function TransactionsIndex() {
	const props = useApp()

	const getInitials = useInitials()
	const { state: sidebarState } = useSidebar()

	const desktopFabOffset =
		sidebarState === "collapsed"
			? "calc(var(--sidebar-width-icon) + 2rem)"
			: "calc(var(--sidebar-width) + 2rem)"

	const [isSheetOpen, setIsSheetOpen] = useState(false)
	const [selectedTransaction, setSelectedTransaction] =
		useState<Transaction | null>(null)
	const [selectedCategory, setSelectedCategory] =
		useState<SheetCategory | null>(null)
	const [txFilters, setTxFilters] = useState<TransactionFilters>({})
	const [periodSummary, setPeriodSummary] = useState<TransactionPeriodSummary>(
		DEFAULT_TRANSACTION_PERIOD_SUMMARY
	)

	useEffect(() => {
		props.get("categories", props.setCategories, "categories")
		props.get("accounts", props.setAccounts, "accounts")
	}, [])

	useEffect(() => {
		const dateQuery = buildFilterQuery(props.dateFilters)
		const txQuery = buildTransactionFilterQuery(txFilters)
		const separator = dateQuery ? "&" : "?"
		const combined = dateQuery
			? `${dateQuery}${separator}${txQuery}`
			: txQuery
				? `?${txQuery}`
				: ""

		Axios.get(`/api/transactions${combined}`)
			.then((response) => {
				const transactions = response.data?.data ?? []
				const summary =
					response.data?.summary ?? DEFAULT_TRANSACTION_PERIOD_SUMMARY

				props.setTransactions(transactions)
				props.setLocalStorage("transactions", transactions)
				setPeriodSummary({
					startingBalance: Number(summary.startingBalance ?? 0),
					endingBalance: Number(summary.endingBalance ?? 0),
					total: Number(summary.total ?? 0),
					currency: String(summary.currency ?? "KES"),
				})
			})
			.catch(() => {
				props.setErrors(["Failed to fetch transactions"])
			})
	}, [props.dateFilters, txFilters])

	function formatCurrencyAmount(value: number): string {
		return value.toLocaleString(undefined, {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		})
	}

	const summaryTone =
		periodSummary.total > 0
			? "text-emerald-600 dark:text-emerald-400"
			: periodSummary.total < 0
				? "text-rose-600 dark:text-rose-400"
				: "text-muted-foreground"

	function handleCreateTransaction(): void {
		setSelectedTransaction(null)
		setSelectedCategory(null)
		setIsSheetOpen(true)
	}

	const sheetTransaction = useMemo(
		() =>
			selectedTransaction
				? {
						id: selectedTransaction.id,
						amount: selectedTransaction.amount.amount,
						notes: selectedTransaction.notes,
						transactionDate: selectedTransaction.transactionDateInput,
						accountId: selectedTransaction.accountId,
						categoryId: selectedTransaction.categoryId,
					}
				: null,
		[selectedTransaction]
	)

	function handleEditTransaction(transaction: Transaction): void {
		setSelectedTransaction(transaction)
		setSelectedCategory(
			props.categories.find(
				(category) => String(category.id) === String(transaction.categoryId)
			) ?? {
				id: transaction.categoryId,
				name: transaction.categoryName ?? "Category",
				icon: transaction.categoryIcon ?? null,
				color: transaction.categoryColor ?? null,
			}
		)
		setIsSheetOpen(true)
	}

	return (
		<>
			<Head title="Transactions" />

			{/* Transactions Content Section Start */}
			<div className="flex flex-1 justify-center sm:p-4">
				<SwipeableDateView className="w-full max-w-4xl space-y-1">
					<div className="flex flex-col items-center justify-between gap-2 mb-2">
						<DateFilterSheet />
					</div>

					<Card className="mb-3 border border-border/70 bg-card/70 p-0">
						<CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
							<div className="flex justify-between gap-1">
								<div className="space-y-1">
									<p className="text-xs tracking-wide text-muted-foreground uppercase">
										Starting balance
									</p>
									<p className="text-base font-semibold">
										{periodSummary.currency}{" "}
										{formatCurrencyAmount(periodSummary.startingBalance)}
									</p>
								</div>

								<div className="space-y-1">
									<p className="text-xs tracking-wide text-muted-foreground uppercase">
										Ending balance
									</p>
									<p className="text-base font-semibold">
										{periodSummary.currency}{" "}
										{formatCurrencyAmount(periodSummary.endingBalance)}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<div className="flex items-end justify-end gap-2 space-y-1">
						<p className="text-xs text-muted-foreground uppercase">Total</p>
						<p className={`text-base font-semibold ${summaryTone}`}>
							{periodSummary.total >= 0 ? "+" : "-"}
							{periodSummary.currency}{" "}
							{formatCurrencyAmount(Math.abs(periodSummary.total))}
						</p>
					</div>

					{props.transactions.length > 0 ? (
						/* Transaction List Section Start */
						<div className="space-y-2">
							{props.transactions.map((transaction) => {
								const transactionType = transaction.categoryType ?? "expense"

								const amountTone =
									transactionType === "income"
										? "text-emerald-600 dark:text-emerald-400"
										: "text-rose-600 dark:text-rose-400"

								return (
									<button
										key={transaction.id}
										type="button"
										onClick={() => handleEditTransaction(transaction)}
										className="block w-full text-left">
										<Card className="overflow-hidden border-0 py-0 transition-colors hover:bg-accent/10">
											<CardContent className="flex justify-between gap-2 px-0">
												{/* Icon Start */}
												<div
													className="flex size-14 shrink-0 items-center justify-center rounded-4xl border border-border/60 text-white shadow-sm"
													style={{
														backgroundColor:
															transaction.categoryColor ??
															transaction.accountColor ??
															"#0f172a",
													}}>
													<LucideIconDisplay
														icon={
															transaction.categoryIcon ??
															transaction.accountIcon
														}
														className="size-8"
														fallback={
															<span className="text-xs font-semibold">
																{getInitials(
																	transaction.categoryName ??
																		transaction.accountName ??
																		""
																)}
															</span>
														}
													/>
												</div>
												{/* Icon End */}

												{/* Data Start */}
												<div className="flex w-full flex-1 justify-between">
													{/* Title and Notes Start */}
													<div className="flex flex-col justify-between gap-1">
														{/* Category Name Start */}
														<div className="text-base leading-tight">
															{transaction.categoryName}
														</div>
														{/* Category Name End */}
														<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
															{/* Account Name Start */}
															<span className="capitalize">
																{transaction.accountName}
															</span>
															{/* Account Name End */}
															{/* Category Type Start */}
															{transaction.categoryType ? (
																<span className="capitalize">
																	{transaction.categoryType}
																</span>
															) : null}
															{/* Category Type End */}
														</div>
														{/* Title and Notes End */}
														{/* Notes Start */}
														<div
															className="text-sm text-white"
															style={{
																color:
																	transaction.categoryColor ??
																	transaction.accountColor ??
																	"#0f172a",
															}}>
															{transaction.notes?.trim()}
														</div>
														{/* Notes End */}
													</div>
													{/* Title and Notes Start */}
													{/* Amount and Date Start */}
													<div className="flex flex-col items-end justify-between">
														{/* Amount Start */}
														<div
															className={`text-md shrink-0 items-end font-semibold ${amountTone}`}>
															{transaction.categoryType === "income"
																? "+"
																: "-"}{" "}
															{transaction.currency}{" "}
															{transaction.amount.formatted}
														</div>
														{/* Amount End */}
														{/* Date Start */}
														<div
															className={`text-xs  items-end font-medium text-muted-foreground me-1`}>
															{transaction.transactionDateHuman}
														</div>
														{/* Date End */}
													</div>
													{/* Amount and Date Start */}
												</div>
												{/* Data End */}
											</CardContent>
										</Card>
									</button>
								)
							})}
						</div>
					) : (
						/* Transaction List Section End */
						/* Empty State Section Start */
						<div className="relative overflow-hidden rounded-2xl border border-dashed bg-card">
							<PlaceholderPattern className="absolute inset-0 size-full stroke-muted-foreground/15" />
							<div className="relative flex min-h-72 flex-col items-center justify-center gap-4 p-6 text-center">
								<div className="flex size-14 items-center justify-center rounded-full border bg-background shadow-sm">
									<ArrowUpDown className="size-6 text-muted-foreground" />
								</div>
								<div className="space-y-2">
									<h2 className="text-lg font-semibold">No transactions yet</h2>
									<p className="max-w-md text-sm text-muted-foreground">
										Record a transaction from your categories to start building
										a complete history of your income and spending.
									</p>
								</div>
								<Button asChild>
									<Link
										href="/categories"
										variant="unstyled"
										size="none">
										<ArrowUpLeft className="size-4" />
										Go to categories
									</Link>
								</Button>
							</div>
						</div>
						/* Empty State Section End */
					)}

					{/* Floating Section Start */}
					<div
						className="fixed right-4 bottom-26 z-30 md:right-(--fab-right-offset) md:bottom-6"
						style={
							{
								"--fab-right-offset": desktopFabOffset,
							} as React.CSSProperties
						}>
						{/* Filters Button Start */}
						<div className="mb-2">
							<TransactionFilterSheet
								filters={txFilters}
								accounts={props.accounts}
								categories={props.categories}
								onApply={setTxFilters}
							/>
						</div>
						<div>
							{/* Filters Button End */}
							{/* Add Transaction Button Start */}
							<Button
								type="button"
								variant="secondary"
								onClick={handleCreateTransaction}
								className="h-14 w-14 rounded-full px-5 shadow-lg">
								<Plus
									className="size-8"
									strokeWidth={1.3}
								/>
								<span className="hidden sm:inline">Add transaction</span>
							</Button>
						</div>
						{/* Add Transaction Button End */}
					</div>
					{/* Floating Section End */}

					{/* Transaction Sheet Section Start */}
					<AddTransactionSheet
						key={`${selectedTransaction?.id ?? "new"}-${isSheetOpen ? "open" : "closed"}`}
						open={isSheetOpen}
						onOpenChange={(open) => {
							setIsSheetOpen(open)

							if (!open) {
								setSelectedTransaction(null)
								setSelectedCategory(null)
							}
						}}
						selectedCategory={selectedCategory}
						onSelectedCategoryChange={setSelectedCategory}
						categories={props.categories}
						accounts={props.accounts}
						transaction={sheetTransaction}
						redirectTo="/transactions"
					/>
					{/* Transaction Sheet Section End */}
				</SwipeableDateView>
			</div>
			{/* Transactions Content Section End */}
		</>
	)
}

TransactionsIndex.layout = {
	breadcrumbs: [
		{
			title: "Transactions",
			href: "/transactions",
		},
	],
}
