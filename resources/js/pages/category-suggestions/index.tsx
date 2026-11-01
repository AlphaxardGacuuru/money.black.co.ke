import { Head } from "@/lib/spa"
import { Lightbulb } from "lucide-react"
import CategorySuggestionsCard from "@/components/categories/category-suggestions-card"
import Heading from "@/components/heading"
import { useApp } from "@/contexts/AppContext"
import { buildFilterQuery } from "@/lib/date-filter"

export default function CategorySuggestionsPage() {
	const props = useApp()

	function refreshCategories() {
		props.get(
			`categories${buildFilterQuery(props.dateFilters)}`,
			props.setCategories,
			"categories"
		)
	}

	return (
		<>
			<Head title="Category ideas" />

			<div className="flex flex-1 justify-center sm:p-4">
				<div className="w-full max-w-3xl space-y-4">
					<div className="relative overflow-hidden rounded-2xl border bg-card px-4 py-4 shadow-xs sm:px-5">
						<div className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/8 via-transparent to-transparent" />

						<div className="relative">
							<Heading
								title="Category ideas"
								description="On the 1st of each month we look at last month's spending and suggest new categories or clearer names. Nothing changes until you add or rename."
							/>
						</div>
					</div>

					<CategorySuggestionsCard
						onChanged={refreshCategories}
						emptyState={
							<div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center text-muted-foreground">
								<Lightbulb className="size-8" />
								<p className="text-sm">
									No ideas right now. New ones arrive at the start of next
									month.
								</p>
							</div>
						}
					/>
				</div>
			</div>
		</>
	)
}

CategorySuggestionsPage.layout = {
	breadcrumbs: [{ title: "Category ideas", href: "/category-suggestions" }],
}
