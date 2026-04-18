import { Link } from "@inertiajs/react"
import { Pencil, Plus } from "lucide-react"
import { useState } from "react"
import AddTransactionSheet from "@/components/add-transaction-sheet"
import LucideIconDisplay from "@/components/lucide-icon-display"
import type { Category } from "@/types/category"
import type { Account } from "@/types/account"
import { useInitials } from "@/hooks/use-initials"
import { Button } from "@/components/ui/button"

type SelectedCategory = Pick<Category, "id" | "name" | "icon" | "color">

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

export default function CategoryGrid({
	categories,
	accounts,
}: CategoryGridProps) {
	// State Section Start
	const getInitials = useInitials()
	const [activeType, setActiveType] = useState<"expense" | "income">("expense")
	const [interactionMode, setInteractionMode] = useState<"entry" | "edit">(
		"entry"
	)
	const [selectedCategory, setSelectedCategory] =
		useState<SelectedCategory | null>(null)
	const [isEntrySheetOpen, setIsEntrySheetOpen] = useState(false)
	// State Section End

	// Derived Data Section Start
	const sortedCategories = [...categories].sort(
		(left, right) =>
			(right.total?.amount ?? 0) - (left.total?.amount ?? 0) ||
			left.name.localeCompare(right.name)
	)
	const visibleCategories = sortedCategories.filter(
		(category) => category.type === activeType
	)

	const expenseCategories = sortedCategories.filter((c) => c.type === "expense")
	const incomeCategories = sortedCategories.filter((c) => c.type === "income")
	const expenseTotal = expenseCategories.reduce(
		(sum, c) => sum + (c.total?.amount ?? 0),
		0
	)
	const incomeTotal = incomeCategories.reduce(
		(sum, c) => sum + (c.total?.amount ?? 0),
		0
	)
	const barCategories = visibleCategories
	const barTotal = barCategories.reduce(
		(sum, c) => sum + (c.total?.amount ?? 0),
		0
	)
	// Derived Data Section End

	// Event Handlers Section Start
	const handleCategoryClick = (category: Category): void => {
		if (interactionMode === "edit") {
			return
		}

		setSelectedCategory({
			id: category.id,
			name: category.name,
			icon: category.icon,
			color: category.color,
		})
		setIsEntrySheetOpen(true)
	}
	// Event Handlers Section End

	return (
		<section className="rounded-2xl border bg-card p-4 shadow-xs sm:p-5">
			{/* Header Controls Section Start */}
			<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
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
							className={`grow rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
								activeType === "expense"
									? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
									: "text-muted-foreground hover:text-foreground"
							}`}>
							Expense
						</button>
						{/* Edit Mode Start */}

						<Button
							type="button"
							className="grow rounded-lg"
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
							className={`grow rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
								activeType === "income"
									? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
									: "text-muted-foreground hover:text-foreground"
							}`}>
							Income
						</button>
					</div>
				</div>
			</div>
			{/* Header Controls Section End */}

			{/* Totals Bar Section Start */}
			{barCategories.length > 0 ? (
				<div className="mb-4 space-y-3">
					<div className="flex h-5 w-full overflow-hidden rounded-full">
						{barCategories.map((category, index) => {
							const percent =
								barTotal > 0
									? ((category.total?.amount ?? 0) / barTotal) * 100
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
								KES{" "}
								{expenseTotal.toLocaleString(undefined, {
									maximumFractionDigits: 0,
								})}
							</span>
						</div>
						<div className="flex items-center gap-1.5">
							<span className="text-muted-foreground">Income</span>
							<span className="font-semibold text-emerald-600 dark:text-emerald-400">
								KES{" "}
								{incomeTotal.toLocaleString(undefined, {
									maximumFractionDigits: 0,
								})}
							</span>
						</div>
					</div>
				</div>
			) : null}
			{/* Totals Bar Section End */}

			{/* Category Cards Section Start */}
			<div className="grid grid-cols-3 gap-2">
				{visibleCategories.map((category, index) =>
					interactionMode === "edit" ? (
						<Link
							key={category.id}
							href={`/categories/${category.id}/edit`}
							className="group flex min-h-28 flex-col rounded-xl border bg-background p-3 text-center transition-colors hover:bg-accent/20"
							style={{
								borderColor: resolveCardColor(category.color, index),
							}}>
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
									{(category.total?.amount ?? 0).toLocaleString(undefined, {
										maximumFractionDigits: 0,
									})}
								</p>
							</div>
						</Link>
					) : (
						<button
							key={category.id}
							type="button"
							onClick={() => handleCategoryClick(category)}
							className="group flex min-h-28 flex-col rounded-xl border bg-background p-3 text-center transition-colors hover:bg-accent/20"
							style={{
								borderColor: resolveCardColor(category.color, index),
							}}>
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
									{(category.total?.amount ?? 0).toLocaleString(undefined, {
										maximumFractionDigits: 0,
									})}
								</p>
							</div>
						</button>
					)
				)}

				{interactionMode === "edit" ? (
					<Link
						href={`/categories/create?type=${activeType}`}
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
			{/* Category Cards Section End */}

			{/* No Categories Section Start */}
			{visibleCategories.length === 0 ? (
				<div className="mt-3 rounded-xl border border-dashed border-border/70 px-3 py-4 text-center text-xs text-muted-foreground">
					No {activeType} categories yet.
				</div>
			) : null}
			{/* No Categories Section End */}

			{/* Transaction Entry Sheet Section Start */}
			<AddTransactionSheet
				key={`${selectedCategory ? String(selectedCategory.id) : "none"}-${isEntrySheetOpen ? "open" : "closed"}`}
				open={isEntrySheetOpen}
				onOpenChange={setIsEntrySheetOpen}
				selectedCategory={selectedCategory}
				onSelectedCategoryChange={setSelectedCategory}
				categories={visibleCategories}
				accounts={accounts}
			/>
			{/* Transaction Entry Sheet Section End */}
		</section>
	)
}
