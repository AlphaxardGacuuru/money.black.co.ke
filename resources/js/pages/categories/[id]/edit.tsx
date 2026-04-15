import { Form, Head, Link, router } from "@inertiajs/react"
import { ArrowLeft } from "lucide-react"
import { useState } from "react"
import CategoryController from "@/actions/App/Http/Controllers/CategoryController"
import Heading from "@/components/heading"
import InputError from "@/components/input-error"
import LucideIconPicker from "@/components/lucide-icon-picker"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"

import type { CategoryResource } from "@/types/category"

type EditCategoryProps = {
	category: CategoryResource
}

export default function EditCategory({ category }: EditCategoryProps) {
	const [isDeleting, setIsDeleting] = useState(false)

	if (!category.data?.id) {
		return (
			/* Missing Category Section Start */
			<div className="p-4">
				<Heading
					title="Category not found"
					description="We couldn't load this category. Please go back and try again."
				/>
			</div>
			/* Missing Category Section End */
		)
	}

	return (
		<>
			<Head title={`Edit ${category.data.name}`} />

			<div className="flex flex-1 flex-col gap-6 p-4">
				{/* Page Header Section Start */}
				<Heading
					title={`Edit ${category.data.name}`}
					description="Update your category details."
				/>
				{/* Page Header Section End */}

				{/* Category Form Section Start */}
				<Form
					{...CategoryController.update["/categories/{category}"].form(
						category.data.id
					)}
					options={{ preserveScroll: true }}
					onSuccess={() =>
						router.visit(CategoryController.index["/categories"].url())
					}
					className="space-y-6">
					{({ processing, errors }) => (
						<>
							{/* Visual Identity Fields Section Start */}
							<div className="grid gap-6 sm:grid-cols-2">
								<div className="grid gap-2">
									<Label htmlFor="icon">Icon</Label>
									<LucideIconPicker
										id="icon"
										name="icon"
										required
										defaultValue={category.data.icon ?? undefined}
										placeholder="Pick an Icon"
									/>
									<InputError message={errors.icon} />
								</div>

								<div className="grid gap-2">
									<Label htmlFor="color">Color</Label>
									<Input
										id="color"
										type="color"
										name="color"
										defaultValue={category.data.color ?? undefined}
										required
									/>
									<InputError message={errors.color} />
								</div>
							</div>
							{/* Visual Identity Fields Section End */}

							{/* Category Name Section Start */}
							<div className="grid gap-2">
								<Label htmlFor="name">Name</Label>
								<Input
									id="name"
									name="name"
									required
									defaultValue={category.data.name}
									placeholder="e.g., Groceries"
								/>
								<InputError message={errors.name} />
							</div>
							{/* Category Name Section End */}

							{/* Category Type Section Start */}
							<div className="grid gap-2">
								<Label>Type</Label>
								<Select
									name="type"
									defaultValue={category.data.type ?? undefined}>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select type" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="expense">Expense</SelectItem>
										<SelectItem value="income">Income</SelectItem>
									</SelectContent>
								</Select>
								<InputError message={errors.type} />
							</div>
							{/* Category Type Section End */}

							{/* Actions Section Start */}
							<div className="flex justify-between gap-3">
								{/* Delete Dialog Section Start */}
								<Dialog>
									<DialogTrigger asChild>
										<Button
											type="button"
											variant="destructive">
											Delete Category
										</Button>
									</DialogTrigger>
									<DialogContent>
										<DialogTitle>Delete this category?</DialogTitle>
										<DialogDescription>
											This action cannot be undone. The category
											<span className="font-medium text-foreground">
												{" "}
												{category.data.name}
											</span>{" "}
											will be permanently deleted.
										</DialogDescription>
										<DialogFooter>
											<DialogClose asChild>
												<Button variant="secondary">Cancel</Button>
											</DialogClose>
											<Button
												type="button"
												variant="destructive"
												disabled={isDeleting}
												onClick={() =>
													router.delete(
														CategoryController.destroy[
															"/categories/{category}"
														].url(category.data.id),
														{
															preserveScroll: true,
															onStart: () => setIsDeleting(true),
															onSuccess: () =>
																router.visit(
																	CategoryController.index["/categories"].url()
																),
															onFinish: () => setIsDeleting(false),
														}
													)
												}>
												{isDeleting && <Spinner />}
												Confirm Delete
											</Button>
										</DialogFooter>
									</DialogContent>
								</Dialog>
								{/* Delete Dialog Section End */}

								<Button
									type="submit"
									disabled={processing}>
									{processing && <Spinner />}
									Save Changes
								</Button>
							</div>
							{/* Actions Section End */}
							{/* Back Navigation Section Start */}
							<div className="flex justify-center">
								<Button
									variant="outline"
									asChild>
									<Link href={CategoryController.index["/categories"].url()}>
										<ArrowLeft className="size-4" />
										Back to Categories
									</Link>
								</Button>
							</div>
							{/* Back Navigation Section End */}
						</>
					)}
				</Form>
				{/* Category Form Section End */}
			</div>
		</>
	)
}

EditCategory.layout = {
	breadcrumbs: [
		{ title: "Categories", href: "/categories" },
		{ title: "Edit", href: "#" },
	],
}
