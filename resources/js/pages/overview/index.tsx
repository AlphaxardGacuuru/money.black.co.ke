import { Head } from "@inertiajs/react"
import { CircleDollarSign, TrendingDown, TrendingUp } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import Heading from "@/components/heading"
import DateFilterSheet from "@/components/categories/date-filter-sheet"
import type { Category } from "@/types/category"
import type { OverviewTotals } from "@/types/overview"
import type { Transaction } from "@/types/transaction"
import { Badge } from "@/components/ui/badge"
import { PlaceholderPattern } from "@/components/ui/placeholder-pattern"
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet"
import { useApp } from "@/contexts/AppContext"
import { buildFilterQuery } from "@/lib/date-filter"
import Axios from "@/lib/axios"

type CategoryWithCumulative = Category & {
	numericTotal: number
	cumulativeTotal: number
	cumulativePercent: number
}

function formatAmount(value: number | string | null | undefined): string {
	const amount = Number(value ?? 0)

	return new Intl.NumberFormat(undefined, {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amount)
}

export default function OverviewIndex() {
	const props = useApp()
	const [activeType, setActiveType] = useState<"expense" | "income">("expense")
	const [selectedCategory, setSelectedCategory] = useState<Category | null>(
		null
	)
	const [categoryTransactions, setCategoryTransactions] = useState<
		Transaction[]
	>([])
	const [isTransactionsSheetOpen, setIsTransactionsSheetOpen] = useState(false)
	const [isTransactionsLoading, setIsTransactionsLoading] = useState(false)

	useEffect(() => {
		const query = buildFilterQuery(props.dateFilters)

		Axios.get(`/api/overview${query}`).then((response) => {
			props.setOverview({
				categories: response.data?.data ?? [],
				totals: response.data?.totals ?? {
					expense: 0,
					income: 0,
					net: 0,
				},
			})
		})
	}, [props.dateFilters, props.setOverview])

	useEffect(() => {
		if (!isTransactionsSheetOpen || !selectedCategory) {
			return
		}

		const controller = new AbortController()
		const dateQuery = buildFilterQuery(props.dateFilters)
		const params = new URLSearchParams(dateQuery.replace(/^\?/, ""))
		params.set("categoryId", String(selectedCategory.id))

		setIsTransactionsLoading(true)

		Axios.get(`/api/transactions?${params.toString()}`, {
			signal: controller.signal,
		})
			.then((response) => {
				setCategoryTransactions(response.data?.data ?? [])
			})
			.catch((error: unknown) => {
				if ((error as { name?: string }).name === "CanceledError") {
					return
				}

				setCategoryTransactions([])
			})
			.finally(() => {
				setIsTransactionsLoading(false)
			})

		return () => {
			controller.abort()
		}
	}, [isTransactionsSheetOpen, props.dateFilters, selectedCategory])

	const categoryList = useMemo(
		() => props.overview.categories ?? [],
		[props.overview.categories]
	)
	const totals: OverviewTotals = props.overview.totals ?? {}

	const filteredCategories = useMemo(() => {
		const sorted = [...categoryList]
			.filter((category) => category.type === activeType)
			.sort((left, right) => {
				const totalDifference =
					(right.total?.amount ?? 0) - (left.total?.amount ?? 0)

				if (totalDifference !== 0) {
					return totalDifference
				}

				return left.name.localeCompare(right.name)
			})

		const selectedTotal = Number(totals?.[activeType] ?? 0)

		return sorted.reduce<CategoryWithCumulative[]>((rows, category) => {
			const numericTotal = category.total?.amount ?? 0
			const previousCumulativeTotal = rows.at(-1)?.cumulativeTotal ?? 0
			const cumulativeTotal = previousCumulativeTotal + numericTotal

			return [
				...rows,
				{
					...category,
					numericTotal,
					cumulativeTotal,
					cumulativePercent:
						selectedTotal > 0
							? Math.min(
									100,
									Math.round((cumulativeTotal / selectedTotal) * 100)
								)
							: 0,
				},
			]
		}, [])
	}, [activeType, categoryList, totals])

	const expenseTotal = Number(totals?.expense ?? 0)
	const incomeTotal = Number(totals?.income ?? 0)
	const netTotal = Number(totals?.net ?? 0)

	function handleCategoryClick(category: Category): void {
		setSelectedCategory(category)
		setIsTransactionsSheetOpen(true)
	}

	return (
		<>
			<Head title="Overview" />

			<div className="flex flex-1 justify-center p-3 sm:p-4">
				<div className="w-full max-w-4xl space-y-4">
					{/* Overview Header Start */}
					<div className="relative overflow-hidden rounded-2xl border bg-card px-4 py-4 shadow-xs sm:px-5">
						<div className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/8 via-transparent to-transparent" />

						<div className="relative flex items-start justify-between gap-3">
							<Heading
								title="Overview"
								description="Track cumulative category totals and see how quickly your budget is concentrated."
							/>
						</div>
					</div>
					{/* Overview Header End */}

					{/* Summary Cards Start */}
					{/* Overview Header End */}

					<DateFilterSheet />

					{/* Summary Cards Start */}
					<div className="grid grid-cols-3 gap-3">
						{/* Expenses Card Start */}
						<div className="rounded-xl border bg-card p-4">
							<div className="flex items-center justify-between">
								<span className="text-sm text-muted-foreground">Expenses</span>
								<TrendingDown className="size-4 text-rose-500" />
							</div>
							<p className="mt-2 text-2xl font-semibold tracking-tight text-rose-600 dark:text-rose-400">
								{formatAmount(expenseTotal)}
							</p>
						</div>
						{/* Expenses Card End */}

						{/* Income Card Start */}
						<div className="rounded-xl border bg-card p-4">
							<div className="flex items-center justify-between">
								<span className="text-sm text-muted-foreground">Income</span>
								<TrendingUp className="size-4 text-emerald-500" />
							</div>
							<p className="mt-2 text-2xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400">
								{formatAmount(incomeTotal)}
							</p>
						</div>
						{/* Income Card End */}

						{/* Net Card Start */}
						<div className="rounded-xl border bg-card p-4">
							<div className="flex items-center justify-between">
								<span className="text-sm text-muted-foreground">Net</span>
								<CircleDollarSign className="size-4 text-primary" />
							</div>
							<p className="mt-2 text-2xl font-semibold tracking-tight">
								{formatAmount(netTotal)}
							</p>
						</div>
						{/* Net Card End */}
					</div>
					{/* Summary Cards End */}

					{/* Cumulative Totals Section Start */}
					<section className="rounded-2xl border bg-card p-4 shadow-xs sm:p-5">
						{/* Cumulative Totals Header Start */}
						<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<p className="text-sm font-semibold tracking-tight">
									Cumulative Category Totals
								</p>
								<p className="text-xs text-muted-foreground">
									Toggle between expense and income to compare cumulative
									contribution by category.
								</p>
							</div>

							{/* Type Toggle Start */}
							<div className="inline-flex justify-between gap-1 rounded-lg border bg-background p-1 sm:min-w-64">
								<button
									type="button"
									onClick={() => setActiveType("expense")}
									className={`grow rounded-l-lg rounded-r px-3 py-1.5 text-xs font-semibold transition-colors ${
										activeType === "expense"
											? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
											: "text-muted-foreground hover:text-foreground"
									}`}>
									Expenses
								</button>
								<button
									type="button"
									onClick={() => setActiveType("income")}
									className={`grow rounded-l rounded-r-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
										activeType === "income"
											? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
											: "text-muted-foreground hover:text-foreground"
									}`}>
									Income
								</button>
							</div>
							{/* Type Toggle End */}
						</div>
						{/* Cumulative Totals Header End */}

						{filteredCategories.length > 0 ? (
							<>
								{/* Category Totals List Start */}
								<div className="space-y-3">
									{filteredCategories.map((category) => (
										<button
											key={String(category.id)}
											type="button"
											onClick={() => handleCategoryClick(category)}
											className="w-full rounded-xl border border-border/70 bg-background p-3 text-left transition-colors hover:bg-accent/10 sm:p-4">
											{/* Category Total Item Start */}
											{/* Category Total Item Header Start */}
											<div className="flex items-center justify-between gap-3">
												<p className="truncate text-sm font-medium">
													{category.name}
												</p>
												<div className="flex items-center gap-2">
													<Badge
														variant="outline"
														className="capitalize">
														{activeType}
													</Badge>
													<span className="text-sm font-semibold">
														{formatAmount(category.numericTotal)}
													</span>
												</div>
											</div>
											{/* Category Total Item Header End */}

											{/* Category Progress Start */}
											<div className="mt-3 space-y-2">
												<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
													<div
														className={`h-full rounded-full ${
															activeType === "expense"
																? "bg-rose-500/80"
																: "bg-emerald-500/80"
														}`}
														style={{ width: `${category.cumulativePercent}%` }}
													/>
												</div>
												<div className="flex items-center justify-between text-xs text-muted-foreground">
													<span>
														Cumulative total:{" "}
														{formatAmount(category.cumulativeTotal)}
													</span>
													<span>{category.cumulativePercent}%</span>
												</div>
											</div>
											{/* Category Progress End */}
											{/* Category Total Item End */}
										</button>
									))}
								</div>
								{/* Category Totals List End */}
							</>
						) : (
							<>
								{/* Empty State Start */}
								<div className="relative overflow-hidden rounded-2xl border border-dashed bg-card">
									<PlaceholderPattern className="absolute inset-0 size-full stroke-muted-foreground/15" />
									<div className="relative flex min-h-48 flex-col items-center justify-center p-6 text-center">
										<p className="text-sm font-medium">
											No {activeType} categories yet
										</p>
										<p className="mt-1 text-sm text-muted-foreground">
											Create {activeType} categories to start seeing cumulative
											totals here.
										</p>
									</div>
								</div>
								{/* Empty State End */}
							</>
						)}
					</section>
					{/* Cumulative Totals Section End */}

					<Sheet
						open={isTransactionsSheetOpen}
						onOpenChange={(open) => {
							setIsTransactionsSheetOpen(open)

							if (!open) {
								setSelectedCategory(null)
								setCategoryTransactions([])
							}
						}}>
						<SheetContent
							side="bottom"
							className="max-h-[85vh] rounded-t-3xl">
							<SheetHeader>
								<SheetTitle>
									{selectedCategory?.name ?? "Category"} transactions
								</SheetTitle>
								<SheetDescription>
									Transactions for this category using the current overview date
									filter.
								</SheetDescription>
							</SheetHeader>

							<div className="space-y-3 overflow-y-auto px-4 pb-6">
								{isTransactionsLoading ? (
									<div className="space-y-3">
										{Array.from({ length: 3 }).map((_, index) => (
											<div
												key={index}
												className="rounded-xl border border-border/70 bg-background p-4">
												<div className="h-4 w-1/3 rounded bg-muted" />
												<div className="mt-3 h-3 w-2/3 rounded bg-muted" />
											</div>
										))}
									</div>
								) : categoryTransactions.length > 0 ? (
									categoryTransactions.map((transaction) => (
										<div
											key={String(transaction.id)}
											className="rounded-xl border border-border/70 bg-background p-4">
											<div className="flex items-start justify-between gap-3">
												<div className="min-w-0 space-y-1">
													<p className="truncate text-sm font-medium">
														{transaction.notes?.trim() ||
															transaction.categoryName}
													</p>
													<p className="text-xs text-muted-foreground">
														{transaction.transactionDateHuman}
													</p>
													<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
														<span>{transaction.accountName}</span>
														<Badge
															variant="outline"
															className="capitalize">
															{transaction.categoryType}
														</Badge>
													</div>
												</div>
												<p
													className={`shrink-0 text-sm font-semibold ${
														transaction.categoryType === "income"
															? "text-emerald-600 dark:text-emerald-400"
															: "text-rose-600 dark:text-rose-400"
													}`}>
													{transaction.categoryType === "income" ? "+" : "-"}{" "}
													{transaction.currency} {transaction.amount.formatted}
												</p>
											</div>
										</div>
									))
								) : (
									<div className="rounded-xl border border-dashed border-border/70 bg-background p-6 text-center">
										<p className="text-sm font-medium">
											No transactions for this category
										</p>
										<p className="mt-1 text-sm text-muted-foreground">
											The current overview filters did not match any
											transactions.
										</p>
									</div>
								)}
							</div>
						</SheetContent>
					</Sheet>
				</div>
			</div>
		</>
	)
}

OverviewIndex.layout = {
	breadcrumbs: [
		{
			title: "Overview",
			href: "/overview",
		},
	],
}
