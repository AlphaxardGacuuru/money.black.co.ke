import { Head, Link } from "@inertiajs/react"
import { ArrowUpRight, Plus, ReceiptText } from "lucide-react"
import { useState } from "react"
import CategoryController from "@/actions/App/Http/Controllers/CategoryController"
import AddTransactionSheet from "@/components/add-transaction-sheet"
import LucideIconDisplay from "@/components/lucide-icon-display"
import type {
	Account,
	Category,
	PaginatedAccounts,
	PaginatedCategories,
} from "@/components/categories/types"

import { useInitials } from "@/hooks/use-initials"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardTitle,
} from "@/components/ui/card"
import { PlaceholderPattern } from "@/components/ui/placeholder-pattern"

type Transaction = {
	id: number | string
	account_id: number | string
	category_id: number | string
	amount: number | string
	currency?: string | null
	notes?: string | null
	transaction_date?: string | null
	created_at?: string | null
	account?: Account | null
	category?: Category | null
}

type PaginatedTransactions = {
	data?: Transaction[]
}

type TransactionsPageProps = {
	transactions?: Transaction[] | PaginatedTransactions
	accounts?: Account[] | PaginatedAccounts
	categories?: Category[] | PaginatedCategories
}

function getTransactions(
	transactions?: Transaction[] | PaginatedTransactions
): Transaction[] {
	if (Array.isArray(transactions)) {
		return transactions
	}

	return transactions?.data ?? []
}

function getAccounts(accounts?: Account[] | PaginatedAccounts): Account[] {
	if (Array.isArray(accounts)) {
		return accounts
	}

	return accounts?.data ?? []
}

function getCategories(
	categories?: Category[] | PaginatedCategories
): Category[] {
	if (Array.isArray(categories)) {
		return categories
	}

	return categories?.data ?? []
}

function formatAmount(transaction: Transaction): string {
	const amount = Number(transaction.amount ?? 0)

	if (Number.isNaN(amount)) {
		return String(transaction.amount ?? 0)
	}

	const currency =
		transaction.currency ?? transaction.account?.currency ?? "KES"

	try {
		return new Intl.NumberFormat(undefined, {
			style: "currency",
			currency,
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(amount)
	} catch {
		return `${currency} ${new Intl.NumberFormat(undefined, {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(amount)}`
	}
}

function formatTransactionDate(transactionDate?: string | null): string {
	if (!transactionDate) {
		return "Unknown date"
	}

	const parsedDate = new Date(transactionDate)

	if (Number.isNaN(parsedDate.getTime())) {
		return transactionDate
	}

	return parsedDate.toLocaleDateString(undefined, {
		weekday: "short",
		month: "short",
		day: "numeric",
		year: "numeric",
	})
}

export default function TransactionsIndex({
	transactions,
	accounts,
	categories,
}: TransactionsPageProps) {
	const getInitials = useInitials()
	const transactionList = getTransactions(transactions)
	const accountList = getAccounts(accounts)
	const categoryList = getCategories(categories)
	const [isSheetOpen, setIsSheetOpen] = useState(false)
	const [selectedTransaction, setSelectedTransaction] =
		useState<Transaction | null>(null)
	const [selectedCategory, setSelectedCategory] = useState<Category | null>(
		null
	)

	function handleCreateTransaction(): void {
		setSelectedTransaction(null)
		setSelectedCategory(null)
		setIsSheetOpen(true)
	}

	function handleEditTransaction(transaction: Transaction): void {
		setSelectedTransaction(transaction)
		setSelectedCategory(
			categoryList.find(
				(category) => String(category.id) === String(transaction.category_id)
			) ??
				transaction.category ??
				null
		)
		setIsSheetOpen(true)
	}

	return (
		<>
			<Head title="Transactions" />

			<div className="flex flex-1 justify-center p-2 sm:p-4">
				<div className="w-full max-w-4xl space-y-3 pb-24 md:pb-8">
					{transactionList.length > 0 ? (
						<div className="space-y-3">
							{transactionList.map((transaction) => {
								const transactionType = transaction.category?.type ?? "expense"
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
										<Card className="overflow-hidden border-border/80 py-0 transition-colors hover:bg-accent/10">
											<CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
												<div className="flex min-w-0 items-start justify-between gap-3">
													<div className="flex gap-2">
														{/* Icon Start */}
														<div
															className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border/60 text-white shadow-sm"
															style={{
																backgroundColor:
																	transaction.category?.color ??
																	transaction.account?.color ??
																	"#0f172a",
															}}>
															<LucideIconDisplay
																icon={
																	transaction.category?.icon ??
																	transaction.account?.icon
																}
																className="size-4"
																fallback={
																	<span className="text-xs font-semibold">
																		{getInitials(
																			transaction.category?.name ??
																				transaction.account?.name ??
																				""
																		)}
																	</span>
																}
															/>
														</div>
														{/* Icon End */}

														{/* Data Start */}
														<div className="min-w-0 flex-1">
															<div className="space-y-1">
																<CardTitle className="text-base leading-tight">
																	{transaction.notes?.trim() ||
																		transaction.category?.name ||
																		"Transaction"}
																</CardTitle>
																<CardDescription>
																	{formatTransactionDate(
																		transaction.transaction_date
																	)}
																</CardDescription>
															</div>

															<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
																{transaction.account?.name
																	? transaction.account.name
																	: null}

																{transaction.category?.type ? (
																	<span className="capitalize">
																		{transaction.category.type}
																	</span>
																) : null}
															</div>
														</div>
														{/* Data End */}
													</div>

													{/* Amount Start */}
													<p
														className={`shrink-0 text-lg font-semibold tracking-tight ${amountTone}`}>
														{transaction.category?.type === "income"
															? "+"
															: "-"}
														{formatAmount(transaction)}
													</p>
													{/* Amount End */}
												</div>
											</CardContent>
										</Card>
									</button>
								)
							})}
						</div>
					) : (
						<div className="relative overflow-hidden rounded-2xl border border-dashed bg-card">
							<PlaceholderPattern className="absolute inset-0 size-full stroke-muted-foreground/15" />
							<div className="relative flex min-h-72 flex-col items-center justify-center gap-4 p-6 text-center">
								<div className="flex size-14 items-center justify-center rounded-full border bg-background shadow-sm">
									<ReceiptText className="size-6 text-muted-foreground" />
								</div>
								<div className="space-y-2">
									<h2 className="text-lg font-semibold">No transactions yet</h2>
									<p className="max-w-md text-sm text-muted-foreground">
										Record a transaction from your categories to start building
										a complete history of your income and spending.
									</p>
								</div>
								<Button asChild>
									<Link href={CategoryController.index["/categories"].url()}>
										<ArrowUpRight className="size-4" />
										Go to categories
									</Link>
								</Button>
							</div>
						</div>
					)}

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
						categories={categoryList}
						accounts={accountList}
						transaction={selectedTransaction}
						redirectTo="/transactions"
					/>
				</div>
			</div>

			<div className="fixed right-4 bottom-26 z-30 md:right-6 md:bottom-6">
				<Button
					type="button"
					onClick={handleCreateTransaction}
					className="h-14 w-14 rounded-full px-5 shadow-lg">
					<Plus className="size-8" />
					<span className="hidden sm:inline">Add transaction</span>
				</Button>
			</div>
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
