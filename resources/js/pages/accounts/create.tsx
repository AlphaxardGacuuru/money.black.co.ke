import { Head, Link, router } from "@inertiajs/react"
import type { FormEvent } from "react"
import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import AccountController from "@/actions/App/Http/Controllers/AccountController"
import Heading from "@/components/heading"
import InputError from "@/components/input-error"
import LucideIconPicker from "@/components/lucide-icon-picker"
import Axios from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { SelectField, SelectItem } from "@/components/ui/select"
import { useApp } from "@/contexts/AppContext"

export default function CreateAccount() {
	const props = useApp()
	const [icon, setIcon] = useState("")
	const [color, setColor] = useState("#0f172a")
	const [name, setName] = useState("")
	const [currency, setCurrency] = useState("KES")
	const [type, setType] = useState<"regular" | "savings" | "mobile" | "">("")
	const [description, setDescription] = useState("")
	const [isDefault, setIsDefault] = useState(false)
	const [errors, setErrors] = useState<
		Partial<
			Record<
				"icon" | "color" | "name" | "currency" | "type" | "description",
				string
			>
		>
	>({})
	const [loading, setLoading] = useState(false)

	const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
		event.preventDefault()
		setErrors({})
		setLoading(true)

		Axios.post(AccountController.store.url(), {
			icon,
			color,
			name,
			currency,
			type,
			description,
			isDefault: isDefault,
		})
			.then((response) => {
				toast.success(response.data.message)
				setTimeout(() => router.visit("/accounts"), 500)
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
						currency: props.getFieldError(response.data.errors.currency),
						type: props.getFieldError(response.data.errors.type),
						description: props.getFieldError(response.data.errors.description),
					})
				}
			})
			.finally(() => {
				setLoading(false)
			})
	}

	return (
		<>
			<Head title="Create Account" />

			<div className="flex flex-1 flex-col gap-6 p-4">
				{/* Page Header Section Start */}
				<Heading
					title="Create Account"
					description="Add a new account to track your finances."
				/>
				{/* Page Header Section End */}

				{/* Account Form Section Start */}
				<form
					onSubmit={onSubmit}
					className="space-y-6">
					{/* Visual Identity Fields Section Start */}
					<div className="grid gap-6 sm:grid-cols-2">
						<LucideIconPicker
							id="icon"
							name="icon"
							defaultValue={icon || undefined}
							required
							placeholder="Select account icon"
							label="Icon"
							onChange={setIcon}
							error={errors.icon}
						/>

						<Input
							label="Color"
							id="color"
							type="color"
							name="color"
							value={color}
							onChange={(event) => setColor(event.target.value)}
							required
							error={errors.color}
						/>
					</div>
					{/* Visual Identity Fields Section End */}

					{/* Account Details Section Start */}
					<Input
						label="Name"
						id="name"
						name="name"
						value={name}
						onChange={(event) => setName(event.target.value)}
						required
						placeholder="e.g., Equity Bank, M-Pesa"
						error={errors.name}
					/>
					{/* Account Details Section End */}

					{/* Account Classification Section Start */}
					<div className="grid gap-6 sm:grid-cols-2">
						<SelectField
							name="currency"
							value={currency}
							onValueChange={setCurrency}
							label="Currency"
							error={errors.currency}>
							<SelectItem value="KES">KES</SelectItem>
						</SelectField>

						<SelectField
							name="type"
							value={type || undefined}
							onValueChange={(value) =>
								setType(value as "regular" | "savings")
							}
							label="Type"
							placeholder="Select type"
							error={errors.type}>
							<SelectItem value="regular">Regular</SelectItem>
							<SelectItem value="savings">Savings</SelectItem>
						</SelectField>
					</div>
					{/* Account Classification Section End */}

					{/* Description Section Start */}
					<div className="grid gap-2">
						<Label htmlFor="description">Description</Label>
						<textarea
							id="description"
							name="description"
							rows={3}
							value={description}
							onChange={(event) => setDescription(event.target.value)}
							placeholder="Optional details about this account..."
							className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
						/>
						<InputError message={errors.description} />
					</div>
					{/* Description Section End */}

					{/* Default Toggle Section Start */}
					<div className="flex items-center gap-3">
						<Switch
							id="isDefault"
							checked={isDefault}
							onCheckedChange={setIsDefault}
						/>
						<Label
							htmlFor="isDefault"
							className="cursor-pointer">
							Set as Default Account
						</Label>
					</div>
					{/* Default Toggle Section End */}

					{/* Form Actions Section Start */}
					<div className="flex justify-between">
						<Button
							variant="outline"
							asChild>
							<Link href="/accounts">
								<ArrowLeft className="size-4" />
								Back to Accounts
							</Link>
						</Button>

						<Button
							type="submit"
							disabled={loading}>
							{loading && <Spinner />}
							Create Account
						</Button>
					</div>
					{/* Form Actions Section End */}
				</form>
				{/* Account Form Section End */}
			</div>
		</>
	)
}

CreateAccount.layout = {
	breadcrumbs: [
		{ title: "Accounts", href: "/accounts" },
		{ title: "Create", href: "/accounts/create" },
	],
}
