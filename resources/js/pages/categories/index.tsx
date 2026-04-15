import { Head, Link } from "@inertiajs/react"
import { Plus, Tags } from "lucide-react"
import CategoryController from "@/actions/App/Http/Controllers/CategoryController"
import CategoryGrid from "@/components/categories/category-grid"
import type { CategoryPageProps } from "@/types/category"
import type { AccountPageProps } from "@/types/account"
import { Button } from "@/components/ui/button"
import { PlaceholderPattern } from "@/components/ui/placeholder-pattern"

export default function CategoriesIndex({
	categories,
	accounts,
}: CategoryPageProps & AccountPageProps) {
	
	return (
		<>
			<Head title="Categories" />

			{/* Categories Content Section Start */}
			<div className="flex flex-1 justify-center p-3 sm:p-4">
				<div className="w-full max-w-3xl space-y-4">
					{categories.data.length > 0 ? (
						/* Category Grid Section Start */
						<CategoryGrid
							categories={categories.data}
							accounts={accounts.data}
						/>
					) : (
						/* Category Grid Section End */
						/* Empty State Section Start */
						<div className="relative overflow-hidden rounded-2xl border border-dashed bg-card">
							<PlaceholderPattern className="absolute inset-0 size-full stroke-muted-foreground/15" />
							<div className="relative flex min-h-72 flex-col items-center justify-center gap-4 p-6 text-center">
								<div className="flex size-14 items-center justify-center rounded-full border bg-background shadow-sm">
									<Tags className="size-6 text-muted-foreground" />
								</div>
								<div className="space-y-2">
									<h2 className="text-lg font-semibold">No categories yet</h2>
									<p className="max-w-md text-sm text-muted-foreground">
										Create your first category to start organizing spending and
										income like a real budget app.
									</p>
								</div>
								<Button asChild>
									<Link
										href={CategoryController.create.url({
											query: { type: "expense" },
										})}>
										<Plus className="size-4" />
										Create category
									</Link>
								</Button>
							</div>
						</div>
						/* Empty State Section End */
					)}
				</div>
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
