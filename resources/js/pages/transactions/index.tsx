import { Head, Link } from "@inertiajs/react"
import { ArrowUpRight, Plus, ReceiptText } from "lucide-react"
import { useState } from "react"
import CategoryController from "@/actions/App/Http/Controllers/CategoryController"
import AddTransactionSheet from "@/components/add-transaction-sheet"
import LucideIconDisplay from "@/components/lucide-icon-display"
import type { Category, CategoryPageProps } from "@/types/category"
import type { AccountPageProps } from "@/types/account"
import type { Transaction, TransactionPageProps } from "@/types/transaction"

import { useInitials } from "@/hooks/use-initials"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardTitle,
} from "@/components/ui/card"
import { PlaceholderPattern } from "@/components/ui/placeholder-pattern"

type SheetCategory = Pick<Category, "id" | "name" | "icon" | "color">

export default function TransactionsIndex({
	transactions,
	accounts,
	categories,
}: TransactionPageProps & AccountPageProps & CategoryPageProps) {
	const getInitials = useInitials()

	const [isSheetOpen, setIsSheetOpen] = useState(false)
	const [selectedTransaction, setSelectedTransaction] =
		useState<Transaction | null>(null)
	const [selectedCategory, setSelectedCategory] =
		useState<SheetCategory | null>(null)

	function handleCreateTransaction(): void {
		setSelectedTransaction(null)
		setSelectedCategory(null)
		setIsSheetOpen(true)
	}

	function handleEditTransaction(transaction: Transaction): void {
		setSelectedTransaction(transaction)
		setSelectedCategory(
			categories.data.find(
				(category) => String(category.id) === String(transaction.categoryId)
			) ?? {
				id: transaction.categoryId,
				name: transaction.categoryName,
				icon: transaction.categoryIcon,
				color: transaction.categoryColor,
			}
		)
		setIsSheetOpen(true)
	}

	return (
		<>
			<Head title="Transactions" />

			{/* Transactions Content Section Start */}
			<div className="flex flex-1 justify-center p-2 sm:p-4">
				<div className="w-full max-w-4xl space-y-1 pb-24 md:pb-8">
					{transactions.data.length > 0 ? (
						/* Transaction List Section Start */
						<div className="space-y-2">
							{transactions.data.map((transaction) => {
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
										<Card className="overflow-hidden border-border/80 py-0 transition-colors hover:bg-accent/10">
											<CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
												<div className="flex min-w-0 items-start justify-between gap-3">
													<div className="flex gap-2">
														{/* Icon Start */}
														<div
															className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-border/60 text-white shadow-sm"
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
																className="size-6"
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
														<div className="min-w-0 flex-1">
															<div className="space-y-1">
																<CardTitle className="text-base leading-tight">
																	{transaction.notes?.trim() ||
																		transaction.categoryName ||
																		"Transaction"}
																</CardTitle>
																<CardDescription>
																	{transaction.transactionDateHuman}
																</CardDescription>
															</div>

															<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
																{transaction.accountName
																	? transaction.accountName
																	: null}

																{transaction.categoryType ? (
																	<span className="capitalize">
																		{transaction.categoryType}
																	</span>
																) : null}
															</div>
														</div>
														{/* Data End */}
													</div>

													{/* Amount Start */}
													<p
														className={`shrink-0 text-lg font-semibold tracking-tight ${amountTone}`}>
														{transaction.categoryType === "income" ? "+" : "-"}{" "}
														{transaction.currency}{" "}
														{transaction.amount.formatted}
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
						/* Transaction List Section End */
						/* Empty State Section Start */
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
						/* Empty State Section End */
					)}

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
						categories={categories.data}
						accounts={accounts.data}
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

			{/* Floating Add Action Section Start */}
			<div className="fixed right-4 bottom-26 z-30 md:right-6 md:bottom-6">
				<Button
					type="button"
					variant="secondary"
					onClick={handleCreateTransaction}
					className="h-14 w-14 rounded-full px-5 shadow-lg">
					<Plus className="size-8" />
					<span className="hidden sm:inline">Add transaction</span>
				</Button>
			</div>
			{/* Floating Add Action Section End */}
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
