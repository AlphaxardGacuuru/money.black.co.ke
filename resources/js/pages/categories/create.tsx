import { Head, Link, router } from "@inertiajs/react"
import type { FormEvent } from "react"
import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import CategoryController from "@/actions/App/Http/Controllers/CategoryController"
import Heading from "@/components/heading"
import LucideIconPicker from "@/components/lucide-icon-picker"
import Axios from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { SelectField, SelectItem } from "@/components/ui/select"
import { useApp } from "@/contexts/AppContext"

type CreateCategoryProps = {
	defaultType?: "expense" | "income" | null
}

type CategoryFormErrors = Partial<
	Record<"icon" | "color" | "name" | "type", string>
>

export default function CreateCategory({ defaultType }: CreateCategoryProps) {
	const props = useApp()

	const [icon, setIcon] = useState("")
	const [color, setColor] = useState("")
	const [name, setName] = useState<string>()
	const [type, setType] = useState<"expense" | "income" | "">(defaultType ?? "")
	const [errors, setErrors] = useState<CategoryFormErrors>({})
	const [loading, setLoading] = useState(false)

	const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
		event.preventDefault()
		setErrors({})
		setLoading(true)

		Axios.post(CategoryController.store.url(), {
			icon,
			color,
			name,
			type,
		})
			.then((response) => {
				setLoading(false)
				toast.success(response.data.message)
				setTimeout(() => router.visit("/categories"), 500)
			})
			.catch((error: unknown) => {
				setLoading(false)
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
	}

	return (
		<>
			<Head title="Create Category" />

			<div className="flex flex-1 flex-col gap-6 p-4">
				{/* Page Header Section Start */}
				<Heading
					title="Create Category"
					description="Add a category for your income or expenses."
				/>
				{/* Page Header Section End */}

				{/* Category Form Section Start */}
				<form
					onSubmit={onSubmit}
					className="space-y-6">
					{/* Visual Identity Fields Section Start */}
					<div className="grid gap-6 sm:grid-cols-2">
						<LucideIconPicker
							id="icon"
							label="Icon"
							name="icon"
							defaultValue={icon || undefined}
							required
							placeholder="Pick an Icon"
							onChange={setIcon}
							error={errors.icon}
						/>

						<Input
							label="Color"
							id="color"
							type="color"
							name="color"
							value={color}
							onChange={(e) => setColor(e.target.value)}
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
						required
						placeholder="e.g., Groceries"
						onChange={(e) => setName(e.target.value)}
						error={errors.name}
					/>
					{/* Category Name Section End */}

					{/* Category Type Section Start */}
					<SelectField
						name="type"
						value={type || undefined}
						onValueChange={(value) => setType(value as "expense" | "income")}
						label="Type"
						placeholder="Select type"
						error={errors.type}>
						<SelectItem value="expense">Expense</SelectItem>
						<SelectItem value="income">Income</SelectItem>
					</SelectField>
					{/* Category Type Section End */}

					{/* Form Actions Section Start */}
					<div className="flex justify-between">
						<Button
							variant="outline"
							asChild>
							<Link href="/categories">
								<ArrowLeft className="size-4" />
								Back to Categories
							</Link>
						</Button>

						<Button
							type="submit"
							disabled={loading}>
							{loading && <Spinner />}
							Create Category
						</Button>
					</div>
					{/* Form Actions Section End */}
				</form>
				{/* Category Form Section End */}
			</div>
		</>
	)
}

CreateCategory.layout = {
	breadcrumbs: [
		{ title: "Categories", href: "/categories" },
		{ title: "Create", href: "/categories/create" },
	],
}
