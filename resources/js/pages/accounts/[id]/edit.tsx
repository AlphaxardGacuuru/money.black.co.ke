import { useEffect, useState } from "react"
import { Head, Link, router } from "@inertiajs/react"
import { ArrowLeft, Trash2 } from "lucide-react"
import type { FormEvent } from "react"
import AccountController from "@/actions/App/Http/Controllers/AccountController"
import type { Account } from "@/types/account"
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
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { SelectField, SelectItem } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { useApp } from "@/contexts/AppContext"

type AccountFormErrors = Partial<
	Record<
		"icon" | "color" | "name" | "currency" | "type" | "description",
		string
	>
>

export default function EditAccount({ id }: { id: string }) {
	const props = useApp()

	const [account, setAccount] = useState<Account>({} as Account)

	const [icon, setIcon] = useState("")
	const [color, setColor] = useState("#0f172a")
	const [name, setName] = useState("")
	const [currency, setCurrency] = useState("KES")
	const [type, setType] = useState<"regular" | "savings" | "mobile" | "">("")
	const [description, setDescription] = useState("")
	const [isDefault, setIsDefault] = useState(false)
	const [processing, setProcessing] = useState(false)
	const [errors, setErrors] = useState<AccountFormErrors>({})
	const [isDeleting, setIsDeleting] = useState(false)

	useEffect(() => {
		Axios.get(`api/accounts/${id}`).then((response) => {
			setAccount(response.data.data)
			setIcon(response.data.data.icon ?? "")
			setColor(response.data.data.color ?? "#0f172a")
			setName(response.data.data.name ?? "")
			setCurrency(response.data.data.currency ?? "KES")
			setType((response.data.data.type as "regular" | "savings" | "mobile") ?? "")
			setDescription(response.data.data.description ?? "")
			setIsDefault(Boolean(response.data.data.isDefault))
		})
	}, [id])

	const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
		event.preventDefault()

		setErrors({})
		setProcessing(true)

		Axios.patch(AccountController.update.url(id), {
			icon,
			color,
			name,
			currency,
			type,
			description,
			isDefault: isDefault,
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
						currency: props.getFieldError(response.data.errors.currency),
						type: props.getFieldError(response.data.errors.type),
						description: props.getFieldError(response.data.errors.description),
					})
				}
			})
			.finally(() => {
				setProcessing(false)
			})
	}

	const handleDelete = (): void => {
		setIsDeleting(true)

		Axios.delete(AccountController.destroy.url(id))
			.then((res) => {
				toast.success(res.data.message)
				setTimeout(() => router.visit("/accounts"), 500)
			})
			.finally(() => {
				setIsDeleting(false)
			})
	}

	if (!account.id) {
		return (
			/* Missing Account Section Start */
			<div className="p-4">
				<Heading
					title="Account not found"
					description="We couldn't load this account. Please go back and try again."
				/>
			</div>
			/* Missing Account Section End */
		)
	}

	return (
		<>
			<Head title={`Edit ${account.name}`} />

			<div className="flex flex-1 flex-col gap-6 p-4">
				{/* Page Header Section Start */}
				<Heading
					title={`Edit ${account.name}`}
					description="Update your account details."
				/>
				{/* Page Header Section End */}

				{/* Account Form Section Start */}
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
							<SelectItem value="USD">USD</SelectItem>
						</SelectField>

						<SelectField
							name="type"
							value={type || undefined}
							onValueChange={(value) =>
								setType(value as "regular" | "savings" | "mobile")
							}
							label="Type"
							placeholder="Select type"
							error={errors.type}>
							<SelectItem value="regular">Regular</SelectItem>
							<SelectItem value="savings">Savings</SelectItem>
							<SelectItem value="mobile">Mobile</SelectItem>
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
						<input
							type="hidden"
							name="isDefault"
							value={isDefault ? "1" : "0"}
						/>
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

					{/* Actions Section Start */}
					<div className="flex justify-between gap-3">
						{/* Delete Dialog Section Start */}
						<Dialog>
							<DialogTrigger asChild>
								<Button
									type="button"
									variant="destructive">
									<Trash2 className="size-4" />
									Delete Account
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogTitle>Delete this account?</DialogTitle>
								<DialogDescription>
									This action cannot be undone. The account
									<span className="font-medium text-foreground">
										{" "}
										{account.name}
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
							<Link href="/accounts">
								<ArrowLeft className="size-4" />
								Back to Accounts
							</Link>
						</Button>
					</div>
					{/* Back Navigation Section End */}
				</form>
				{/* Account Form Section End */}
			</div>
		</>
	)
}

EditAccount.layout = {
	breadcrumbs: [
		{ title: "Accounts", href: "/accounts" },
		{ title: "Edit", href: "#" },
	],
}
