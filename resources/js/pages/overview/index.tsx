import { Head } from "@inertiajs/react"
import { CircleDollarSign, TrendingDown, TrendingUp } from "lucide-react"
import { useMemo, useState } from "react"
import Heading from "@/components/heading"
import type { Category, CategoryCollection } from "@/types/category"
import { Badge } from "@/components/ui/badge"
import { PlaceholderPattern } from "@/components/ui/placeholder-pattern"

type OverviewTotals = {
	expense?: number | string
	income?: number | string
	net?: number | string
}

type OverviewPageProps = {
	categories?: Category[] | CategoryCollection
	totals?: OverviewTotals
}

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

export default function OverviewIndex({
	categories,
	totals,
}: OverviewPageProps) {
	const [activeType, setActiveType] = useState<"expense" | "income">("expense")
	const categoryList = useMemo(
		() => (Array.isArray(categories) ? categories : (categories?.data ?? [])),
		[categories]
	)

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
										<div
											key={String(category.id)}
											className="rounded-xl border border-border/70 bg-background p-3 sm:p-4">
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
										</div>
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
