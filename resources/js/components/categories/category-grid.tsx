import { Link } from "@inertiajs/react"
import { Pencil, Plus } from "lucide-react"
import { useState } from "react"
import CategoryController from "@/actions/App/Http/Controllers/CategoryController"
import AddTransactionSheet from "@/components/add-transaction-sheet"
import LucideIconDisplay from "@/components/lucide-icon-display"
import type { Account, Category } from "@/components/categories/types"
import { useInitials } from "@/hooks/use-initials"
import { Button } from "@/components/ui/button"

function getNumericTotal(category: Category): number {
	const total = Number(category.total ?? 0)

	return Number.isNaN(total) ? 0 : total
}

function getCategoryType(type?: string | null): "expense" | "income" | "other" {
	if (type === "expense" || type === "income") {
		return type
	}

	return "other"
}

function formatInteger(value: number): string {
	return new Intl.NumberFormat(undefined, {
		maximumFractionDigits: 0,
	}).format(value)
}

function resolveCardColor(
	color: string | null | undefined,
	index: number
): string {
	const fallbackColors = [
		"#0ea5e9",
		"#10b981",
		"#f97316",
		"#e11d48",
		"#8b5cf6",
		"#14b8a6",
		"#f59e0b",
	]

	if (typeof color === "string" && color.trim() !== "") {
		return color
	}

	return fallbackColors[index % fallbackColors.length]
}

type CategoryGridProps = {
	categories: Category[]
	accounts: Account[]
}

function getCategoryNumericTotal(value?: number | string | null): number {
	const parsed = Number(value ?? 0)

	return Number.isNaN(parsed) ? 0 : parsed
}

export default function CategoryGrid({
	categories,
	accounts,
}: CategoryGridProps) {
	const getInitials = useInitials()
	const [activeType, setActiveType] = useState<"expense" | "income">("expense")
	const [interactionMode, setInteractionMode] = useState<"entry" | "edit">(
		"entry"
	)
	const [selectedCategory, setSelectedCategory] = useState<Category | null>(
		null
	)
	const [isEntrySheetOpen, setIsEntrySheetOpen] = useState(false)

	const sortedCategories = [...categories].sort(
		(left, right) =>
			getNumericTotal(right) - getNumericTotal(left) ||
			left.name.localeCompare(right.name)
	)
	const visibleCategories = sortedCategories.filter(
		(category) => getCategoryType(category.type) === activeType
	)
	const createCategoryUrl = CategoryController.create.url({
		query: { type: activeType },
	})

	const expenseCategories = sortedCategories.filter(
		(c) => getCategoryType(c.type) === "expense"
	)
	const incomeCategories = sortedCategories.filter(
		(c) => getCategoryType(c.type) === "income"
	)
	const expenseTotal = expenseCategories.reduce(
		(sum, c) => sum + getCategoryNumericTotal(c.total),
		0
	)
	const incomeTotal = incomeCategories.reduce(
		(sum, c) => sum + getCategoryNumericTotal(c.total),
		0
	)
	const barCategories = visibleCategories
	const barTotal = barCategories.reduce(
		(sum, c) => sum + getCategoryNumericTotal(c.total),
		0
	)

	const handleCategoryClick = (category: Category): void => {
		if (interactionMode === "edit") {
			return
		}

		setSelectedCategory(category)
		setIsEntrySheetOpen(true)
	}

	return (
		<section className="rounded-2xl border bg-card p-4 shadow-xs sm:p-5">
			<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p className="text-sm font-semibold tracking-tight">Categories</p>
					<p className="text-xs text-muted-foreground">
						{interactionMode === "entry"
							? "Tap a category to add a transaction."
							: "Tap a category to edit it."}
					</p>
				</div>

				<div className="flex flex-col gap-2 sm:items-end">
					<div className="inline-flex justify-between gap-1 rounded-lg border bg-background p-1">
						<button
							type="button"
							onClick={() => setActiveType("expense")}
							className={`grow rounded-l-lg rounded-r px-3 py-1.5 text-xs font-semibold transition-colors ${
								activeType === "expense"
									? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
									: "text-muted-foreground hover:text-foreground"
							}`}>
							Expense
						</button>
						{/* Edit Mode Start */}

						<Button
							type="button"
							className="grow rounded"
							variant={interactionMode === "edit" ? "default" : "outline"}
							size="sm"
							onClick={() =>
								setInteractionMode((currentMode) =>
									currentMode === "entry" ? "edit" : "entry"
								)
							}>
							<Pencil className="size-4" />
						</Button>
						{/* Edit Mode End */}
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
				</div>
			</div>

			{barCategories.length > 0 ? (
				<div className="mb-4 space-y-3">
					<div className="flex h-5 w-full overflow-hidden rounded-full">
						{barCategories.map((category, index) => {
							const percent =
								barTotal > 0
									? (getCategoryNumericTotal(category.total) / barTotal) * 100
									: 0

							return (
								<div
									key={String(category.id)}
									title={category.name}
									style={{
										width: `${percent}%`,
										backgroundColor: resolveCardColor(category.color, index),
									}}
									className="h-full shrink-0 transition-all"
								/>
							)
						})}
					</div>

					<div className="flex items-center justify-between text-xs">
						<div className="flex items-center gap-1.5">
							<span className="text-muted-foreground">Expenses</span>
							<span className="font-semibold text-rose-600 dark:text-rose-400">
								{formatInteger(expenseTotal)}
							</span>
						</div>
						<div className="flex items-center gap-1.5">
							<span className="text-muted-foreground">Income</span>
							<span className="font-semibold text-emerald-600 dark:text-emerald-400">
								{formatInteger(incomeTotal)}
							</span>
						</div>
					</div>
				</div>
			) : null}

			<div className="grid grid-cols-3 gap-2">
				{visibleCategories.map((category, index) =>
					interactionMode === "edit" ? (
						<Link
							key={category.id}
							href={CategoryController.edit.url(category.id)}
							className="group flex min-h-28 flex-col rounded-xl border border-border/70 bg-background p-3 text-center transition-colors hover:bg-accent/20">
							<p className="truncate text-xs leading-tight font-medium">
								{category.name}
							</p>

							<div className="flex flex-1 items-center justify-center">
								<div
									className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border/60 text-white"
									style={{
										backgroundColor: resolveCardColor(category.color, index),
									}}>
									<LucideIconDisplay
										icon={category.icon}
										className="size-4"
										fallback={
											<span className="text-[11px] font-semibold">
												{getInitials(category.name) || "C"}
											</span>
										}
									/>
								</div>
							</div>

							<div className="text-center">
								<p className="text-xs leading-none font-semibold">
									{formatInteger(getNumericTotal(category))}
								</p>
							</div>
						</Link>
					) : (
						<button
							key={category.id}
							type="button"
							onClick={() => handleCategoryClick(category)}
							className="group flex min-h-28 flex-col rounded-xl border border-border/70 bg-background p-3 text-center transition-colors hover:bg-accent/20">
							<p className="truncate text-xs leading-tight font-medium">
								{category.name}
							</p>

							<div className="flex flex-1 items-center justify-center">
								<div
									className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border/60 text-white"
									style={{
										backgroundColor: resolveCardColor(category.color, index),
									}}>
									<LucideIconDisplay
										icon={category.icon}
										className="size-4"
										fallback={
											<span className="text-[11px] font-semibold">
												{getInitials(category.name) || "C"}
											</span>
										}
									/>
								</div>
							</div>

							<div className="text-center">
								<p className="text-xs leading-none font-semibold">
									{formatInteger(getNumericTotal(category))}
								</p>
							</div>
						</button>
					)
				)}

				{interactionMode === "edit" ? (
					<Link
						href={createCategoryUrl}
						className="group flex min-h-28 flex-col rounded-xl border border-dashed border-border/70 bg-background p-3 text-center transition-colors hover:bg-accent/20">
						<p className="truncate text-xs leading-tight font-medium">
							Add category
						</p>

						<div className="flex flex-1 items-center justify-center">
							<div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border/60 text-muted-foreground">
								<Plus className="size-4" />
							</div>
						</div>

						<div className="text-center">
							<p className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
								{activeType}
							</p>
						</div>
					</Link>
				) : null}
			</div>

			{visibleCategories.length === 0 ? (
				<div className="mt-3 rounded-xl border border-dashed border-border/70 px-3 py-4 text-center text-xs text-muted-foreground">
					No {activeType} categories yet.
				</div>
			) : null}

			<AddTransactionSheet
				key={`${selectedCategory ? String(selectedCategory.id) : "none"}-${isEntrySheetOpen ? "open" : "closed"}`}
				open={isEntrySheetOpen}
				onOpenChange={setIsEntrySheetOpen}
				selectedCategory={selectedCategory}
				onSelectedCategoryChange={setSelectedCategory}
				categories={visibleCategories}
				accounts={accounts}
			/>
		</section>
	)
}
