import { Head, Link, router } from "@inertiajs/react"
import { ArrowLeft, Trash2 } from "lucide-react"
import type { FormEvent } from "react"
import { useEffect, useState } from "react"
import CategoryController from "@/actions/App/Http/Controllers/CategoryController"
import Heading from "@/components/heading"
import InputError from "@/components/input-error"
import LucideIconPicker from "@/components/lucide-icon-picker"
import Axios from "@/lib/axios"
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
import { SelectField, SelectItem } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { useApp } from "@/contexts/AppContext"

import type { Category } from "@/types/category"
import { toast } from "sonner"

type CategoryFormErrors = Partial<
	Record<"icon" | "color" | "name" | "type", string>
>

export default function EditCategory({ id }: { id: string }) {
	const props = useApp()

	const [category, setCategory] = useState<Category>({} as Category)

	const [icon, setIcon] = useState("")
	const [color, setColor] = useState("#0f172a")
	const [name, setName] = useState("")
	const [type, setType] = useState<"expense" | "income" | "">()
	const [processing, setProcessing] = useState(false)
	const [errors, setErrors] = useState<CategoryFormErrors>({})
	const [isDeleting, setIsDeleting] = useState(false)

	useEffect(() => {
		Axios.get(`api/categories/${id}`).then((response) => {
			setCategory(response.data)
			setIcon(response.data.icon)
			setColor(response.data.color)
			setName(response.data.name)
			setType(response.data.type)
		})
	}, [])

	const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
		event.preventDefault()

		setErrors({})
		setProcessing(true)

		Axios.patch(CategoryController.update.url(id), {
			icon,
			color,
			name,
			type,
		})
			.then((res) => {
				toast.success(res.data.message)
			})
			.catch((error: unknown) => {
				const response = (
					error as {
						response?: {
							status?: number
							data?: { errors?: Record<string, unknown> }
						}
					}
				).response

				if (response?.status === 422 && response.data?.errors) {
					setErrors({
						icon: props.getFieldError(response.data.errors.icon),
						color: props.getFieldError(response.data.errors.color),
						name: props.getFieldError(response.data.errors.name),
						type: props.getFieldError(response.data.errors.type),
					})
				}
			})
			.finally(() => {
				setProcessing(false)
			})
	}

	const handleDelete = (): void => {
		setIsDeleting(true)

		Axios.delete(CategoryController.destroy.url(id))
			.then((res) => {
				toast.success(res.data.message)
				setTimeout(() => router.visit("/categories"), 500)
			})
			.finally(() => {
				setIsDeleting(false)
			})
	}

	if (!category.id) {
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
			<Head title={`Edit ${category.name}`} />

			<div className="flex flex-1 flex-col gap-6 p-4">
				{/* Page Header Section Start */}
				<Heading
					title={`Edit ${category.name}`}
					description="Update your category details."
				/>
				{/* Page Header Section End */}

				{/* Category Form Section Start */}
				<form
					onSubmit={handleSubmit}
					className="space-y-6">
					{/* Visual Identity Fields Section Start */}
					<div className="grid gap-6 sm:grid-cols-2">
						<div className="grid gap-2">
							<LucideIconPicker
								id="icon"
								label="Icon"
								name="icon"
								defaultValue={icon}
								onChange={setIcon}
							/>
							<InputError message={errors.icon} />
						</div>

						<Input
							label="Color"
							id="color"
							type="color"
							name="color"
							defaultValue={color}
							onChange={(event) => setColor(event.target.value)}
							required
							error={errors.color}
						/>
					</div>
					{/* Visual Identity Fields Section End */}

					{/* Category Name Section Start */}
					<Input
						label="Name"
						id="name"
						name="name"
						value={name}
						onChange={(event) => setName(event.target.value)}
						required
						placeholder="e.g., Groceries"
						error={errors.name}
					/>
					{/* Category Name Section End */}

					{/* Category Type Section Start */}
					<SelectField
						name="type"
						defaultValue={type}
						onValueChange={(value) => setType(value as "expense" | "income")}
						label="Type"
						placeholder="Select type"
						error={errors.type}>
						<SelectItem value="expense">Expense</SelectItem>
						<SelectItem value="income">Income</SelectItem>
					</SelectField>
					{/* Category Type Section End */}

					{/* Actions Section Start */}
					<div className="flex justify-between gap-3">
						{/* Delete Dialog Section Start */}
						<Dialog>
							<DialogTrigger asChild>
								<Button
									type="button"
									variant="destructive">
									<Trash2 className="size-4" />
									Delete Category
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogTitle>Delete this category?</DialogTitle>
								<DialogDescription>
									This action cannot be undone. The category
									<span className="font-medium text-foreground">
										{" "}
										{category.name}
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
										onClick={handleDelete}>
										{isDeleting && <Spinner />}
										<Trash2 className="size-4" />
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
							<Link href="/categories">
								<ArrowLeft className="size-4" />
								Back to Categories
							</Link>
						</Button>
					</div>
					{/* Back Navigation Section End */}
				</form>
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
