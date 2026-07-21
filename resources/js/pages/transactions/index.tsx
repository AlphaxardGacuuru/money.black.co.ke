import { Link } from "@/components/ui/link"
import { Head } from "@/lib/spa"
import { ArrowUpLeft, Plus, ArrowUpDown } from "lucide-react"
import { useEffect, useState } from "react"
import { buildFilterQuery } from "@/lib/date-filter"
import AddTransactionSheet from "@/components/add-transaction-sheet"
import LucideIconDisplay from "@/components/lucide-icon-display"
import type { Category } from "@/types/category"
import type { Transaction } from "@/types/transaction"

import { useInitials } from "@/hooks/use-initials"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PlaceholderPattern } from "@/components/ui/placeholder-pattern"
import { useApp } from "@/contexts/AppContext"
import DateFilterSheet from "@/components/categories/date-filter-sheet"
import TransactionFilterSheet from "@/components/transactions/transaction-filter-sheet"
import type { TransactionFilters } from "@/components/transactions/transaction-filter-sheet"

type SheetCategory = Pick<Category, "id" | "name" | "icon" | "color">

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

	const [isSheetOpen, setIsSheetOpen] = useState(false)
	const [selectedTransaction, setSelectedTransaction] =
		useState<Transaction | null>(null)
	const [selectedCategory, setSelectedCategory] =
		useState<SheetCategory | null>(null)
	const [txFilters, setTxFilters] = useState<TransactionFilters>({})

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
		props.get(`transactions${combined}`, props.setTransactions, "transactions")
	}, [props.dateFilters, txFilters])

	function handleCreateTransaction(): void {
		setSelectedTransaction(null)
		setSelectedCategory(null)
		setIsSheetOpen(true)
	}

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
				<div className="w-full max-w-4xl space-y-1 pb-24 md:pb-8">
					<div className="flex flex-col items-center justify-between gap-2">
						<DateFilterSheet />
						<div className="mb-4 flex w-full items-center justify-end gap-2">
							<Input
								label="Search by notes"
								value={txFilters.notes}
								onChange={(event) =>
									setTxFilters((prev) => ({
										...prev,
										notes: event.target.value || undefined,
									}))
								}
							/>
						</div>
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
											<CardContent className="flex gap-2 px-0 justify-between">
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
													{/* Amount Start */}
													<div
														className={`text-md shrink-0 items-end font-semibold ${amountTone}`}>
														{transaction.categoryType === "income" ? "+" : "-"}{" "}
														{transaction.currency}{" "}
														{transaction.amount.formatted}
													</div>
													{/* Amount End */}
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
					<div className="fixed right-4 bottom-26 z-30 md:right-6 md:bottom-6">
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
						transaction={
							selectedTransaction
								? {
										id: selectedTransaction.id,
										amount: selectedTransaction.amount.amount,
										notes: selectedTransaction.notes,
										transactionDate: selectedTransaction.transactionDateInput,
										accountId: selectedTransaction.accountId,
										categoryId: selectedTransaction.categoryId,
									}
								: null
						}
						redirectTo="/transactions"
					/>
					{/* Transaction Sheet Section End */}
				</div>
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
