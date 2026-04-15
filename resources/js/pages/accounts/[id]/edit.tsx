import { Form, Head, Link, router } from "@inertiajs/react"
import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import AccountController from "@/actions/App/Http/Controllers/AccountController"
import type { AccountResource } from "@/types/account"
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
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"

type EditAccountProps = {
	account: AccountResource
}

export default function EditAccount({ account }: EditAccountProps) {
	const [isDefault, setIsDefault] = useState(account.data?.isDefault ?? false)
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)

	const handleDelete = (): void => {
		setIsDeleting(true)
		router.delete(
			AccountController.destroy["/accounts/{account}"].url(
				account.data?.id ?? ""
			),
			{
				preserveScroll: true,
				onSuccess: () => setIsDeleteDialogOpen(false),
				onFinish: () => setIsDeleting(false),
			}
		)
	}

	if (!account.data?.id) {
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
			<Head title={`Edit ${account.data.name}`} />

			<div className="flex flex-1 flex-col gap-6 p-4">
				{/* Page Header Section Start */}
				<Heading
					title={`Edit ${account.data.name}`}
					description="Update your account details."
				/>
				{/* Page Header Section End */}

				{/* Account Form Section Start */}
				<Form
					{...AccountController.update["/accounts/{account}"].form(
						account.data.id
					)}
					options={{ preserveScroll: true }}
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
										defaultValue={account.data.icon ?? undefined}
										placeholder="Select account icon"
									/>
									<InputError message={errors.icon} />
								</div>

								<div className="grid gap-2">
									<Label htmlFor="color">Color</Label>
									<Input
										id="color"
										type="color"
										name="color"
										defaultValue={account.data.color ?? undefined}
										required
									/>
									<InputError message={errors.color} />
								</div>
							</div>
							{/* Visual Identity Fields Section End */}

							{/* Account Details Section Start */}
							<div className="grid gap-2">
								<Label htmlFor="name">Name</Label>
								<Input
									id="name"
									name="name"
									required
									defaultValue={account.data.name}
									placeholder="e.g., Equity Bank, M-Pesa"
								/>
								<InputError message={errors.name} />
							</div>
							{/* Account Details Section End */}

							{/* Account Classification Section Start */}
							<div className="grid gap-6 sm:grid-cols-2">
								<div className="grid gap-2">
									<Label>Currency</Label>
									<Select
										name="currency"
										defaultValue={account.data.currency ?? "KES"}>
										<SelectTrigger className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="KES">KES</SelectItem>
											<SelectItem value="USD">USD</SelectItem>
										</SelectContent>
									</Select>
									<InputError message={errors.currency} />
								</div>

								<div className="grid gap-2">
									<Label>Type</Label>
									<Select
										name="type"
										defaultValue={account.data.type ?? undefined}>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select type" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="regular">Regular</SelectItem>
											<SelectItem value="savings">Savings</SelectItem>
										</SelectContent>
									</Select>
									<InputError message={errors.type} />
								</div>
							</div>
							{/* Account Classification Section End */}

							{/* Description Section Start */}
							<div className="grid gap-2">
								<Label htmlFor="description">Description</Label>
								<textarea
									id="description"
									name="description"
									rows={3}
									placeholder="Optional details about this account..."
									defaultValue={account.data.description ?? undefined}
									className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
								/>
								<InputError message={errors.description} />
							</div>
							{/* Description Section End */}

							{/* Default Toggle Section Start */}
							<div className="flex items-center gap-3">
								<input
									type="hidden"
									name="is_default"
									value={isDefault ? "1" : "0"}
								/>
								<Switch
									id="is_default"
									checked={isDefault}
									onCheckedChange={setIsDefault}
								/>
								<Label
									htmlFor="is_default"
									className="cursor-pointer">
									Set as Default Account
								</Label>
							</div>
							{/* Default Toggle Section End */}

							{/* Actions Section Start */}
							<div className="flex justify-between gap-3">
								{/* Delete Dialog Section Start */}
								<Dialog
									open={isDeleteDialogOpen}
									onOpenChange={setIsDeleteDialogOpen}>
									<DialogTrigger asChild>
										<Button
											type="button"
											variant="destructive">
											Delete Account
										</Button>
									</DialogTrigger>

									<DialogContent>
										<DialogHeader>
											<DialogTitle>Delete this account</DialogTitle>
											<DialogDescription>
												This action cannot be undone. All data linked to this
												account may become inaccessible.
											</DialogDescription>
										</DialogHeader>

										<DialogFooter>
											<DialogClose asChild>
												<Button
													type="button"
													variant="secondary"
													disabled={isDeleting}>
													Cancel
												</Button>
											</DialogClose>
											<Button
												type="button"
												variant="destructive"
												onClick={handleDelete}
												disabled={isDeleting}>
												{isDeleting && <Spinner />}
												Yes, Delete Account
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
									<Link href={AccountController.index["/accounts"].url()}>
										<ArrowLeft className="size-4" />
										Back to Accounts
									</Link>
								</Button>
							</div>
							{/* Back Navigation Section End */}
						</>
					)}
				</Form>
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
