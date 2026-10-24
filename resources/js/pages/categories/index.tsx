import { Head } from "@/lib/spa"
import { useEffect, useState } from "react"
import CategoryGrid from "@/components/categories/category-grid"
import CategorySuggestionsCard from "@/components/categories/category-suggestions-card"
import StarterCategories from "@/components/categories/starter-categories"
import DateFilterSheet from "@/components/categories/date-filter-sheet"
import SwipeableDateView from "@/components/swipeable-date-view"
import { useApp } from "@/contexts/AppContext"
import { Spinner } from "@/components/ui/spinner"
import { buildFilterQuery } from "@/lib/date-filter"

export default function CategoriesIndex() {
	const props = useApp()

	useEffect(() => {
		props.get("accounts", props.setAccounts, "accounts")
	}, [])

	const [categoriesLoaded, setCategoriesLoaded] = useState(props.categories.length > 0)

	function refreshCategories() {
		const query = buildFilterQuery(props.dateFilters)

		return Promise.resolve(props.get(`categories${query}`, props.setCategories, "categories")).finally(() =>
			setCategoriesLoaded(true)
		)
	}

	useEffect(() => {
		refreshCategories()
	}, [props.dateFilters])

	return (
		<>
			<Head title="Categories" />

			{/* Categories Content Section Start */}
			<div className="flex flex-1 justify-center sm:p-4">
				<SwipeableDateView className="w-full max-w-3xl space-y-4">
					<div className="flex items-center justify-between">
						<DateFilterSheet />
					</div>
					{props.categories.length > 0 ? (
						/* Category Grid Section Start */
						<>
							<CategorySuggestionsCard onChanged={refreshCategories} />
							<CategoryGrid
								categories={props.categories}
								accounts={props.accounts}
							/>
						</>
					) : categoriesLoaded ? (
						/* Category Grid Section End */
						/* Empty State Section Start */
						<StarterCategories onCreated={refreshCategories} />
					) : (
						/* Empty State Section End */
						<div className="flex justify-center py-12">
							<Spinner />
						</div>
					)}
				</SwipeableDateView>
			</div>
			{/* Categories Content Section End */}
		</>
	)
}

CategoriesIndex.layout = {
	breadcrumbs: [
		{
			title: "Categories",
			href: "/categories",
		},
	],
}
