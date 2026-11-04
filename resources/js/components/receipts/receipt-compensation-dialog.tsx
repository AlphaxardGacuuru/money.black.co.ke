import { HandCoins } from "lucide-react"
import { useState } from "react"
import InputError from "@/components/input-error"
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
import { Link } from "@/components/ui/link"
import { SelectField, SelectItem } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import Axios from "@/lib/axios"
import { formatAmount } from "@/lib/receipts"
import { toast } from "@/lib/toast"
import { compensate } from "@/routes/api/receipts"
import type { Account } from "@/types/account"
import type { Category } from "@/types/category"
import type { Receipt } from "@/types/receipt"

type Props = {
	receipt: Receipt
	remaining: number
	accounts: Account[]
	incomeCategories: Category[]
	onCompensated: (receipt: Receipt) => void
}

/** Prefer a category whose name says what this is, e.g. "Reimbursements" or "Refunds". */
function suggestedCategoryId(categories: Category[]): string {
	const match = categories.find((category) =>
		/reimburs|refund|compensat|claim/i.test(category.name)
	)

	return String(match?.id ?? categories[0]?.id ?? "")
}

export default function ReceiptCompensationDialog({
	receipt,
	remaining,
	accounts,
	incomeCategories,
	onCompensated,
}: Props) {
	const [open, setOpen] = useState(false)
	const [amount, setAmount] = useState(remaining)
	const [accountId, setAccountId] = useState(
		receipt.accountId ??
			String(
				accounts.find((account) => account.isDefault)?.id ??
					accounts[0]?.id ??
					""
			)
	)
	const [categoryId, setCategoryId] = useState(() =>
		suggestedCategoryId(incomeCategories)
	)
	const [compensationDate, setCompensationDate] = useState(() =>
		new Date().toLocaleDateString("en-CA")
	)
	const [notes, setNotes] = useState("")
	const [errors, setErrors] = useState<Record<string, string>>({})
	const [processing, setProcessing] = useState(false)

	function handleOpenChange(nextOpen: boolean) {
		setOpen(nextOpen)

		if (nextOpen) {
			setAmount(remaining)
			setCategoryId(
				(current) => current || suggestedCategoryId(incomeCategories)
			)
			setErrors({})
		}
	}

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setProcessing(true)
		setErrors({})

		const { url, method } = compensate(receipt.id)

		Axios.request<{ data: Receipt; message: string }>({
			url,
			method,
			data: {
				account_id: accountId,
				category_id: categoryId,
				amount,
				compensation_date: compensationDate,
				notes: notes || null,
			},
		})
			.then((response) => {
				toast.success(response.data.message)
				onCompensated(response.data.data)
				setNotes("")
				setOpen(false)
			})
			.catch((error: unknown) => {
				const e = error as {
					response?: {
						status?: number
						data?: { errors?: Record<string, string[]> }
					}
				}

				if (e.response?.status === 422) {
					const raw = e.response.data?.errors ?? {}
					setErrors(
						Object.fromEntries(
							Object.entries(raw).map(([key, value]) => [key, value[0]])
						)
					)
					toast.error(
						Object.values(raw)[0]?.[0] ?? "Please fix the highlighted fields."
					)

					return
				}

				toast.error("Something went wrong. Please try again.")
			})
			.finally(() => setProcessing(false))
	}

	return (
		<Dialog
			open={open}
			onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button
					type="button"
					variant="outline"
					disabled={remaining <= 0}
					data-test="add-compensation-button">
					<HandCoins />
					Add compensation
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogTitle>Add compensation</DialogTitle>
				<DialogDescription>
					Record money paid back for this receipt, like a reimbursement or
					refund. It&apos;s added to the account as income. Up to{" "}
					{formatAmount(remaining, receipt.currency)} is left to compensate.
				</DialogDescription>

				{incomeCategories.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						You need an income category (for example &quot;Reimbursements&quot;)
						first.{" "}
						<Link
							href="/categories"
							variant="unstyled"
							className="font-medium text-primary hover:text-primary/80">
							Add one in Categories
						</Link>
					</p>
				) : (
					<form
						onSubmit={handleSubmit}
						className="space-y-4"
						aria-busy={processing}>
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="grid gap-2">
								<Input
									id="compensation_amount"
									type="number"
									inputMode="numeric"
									min={1}
									max={remaining}
									label={`Amount (${receipt.currency})`}
									value={amount || ""}
									onChange={(event) =>
										setAmount(Math.round(Number(event.target.value)) || 0)
									}
								/>
								<InputError message={errors.amount} />
							</div>
							<div className="grid gap-2">
								<Input
									id="compensation_date"
									type="date"
									label="Received on"
									value={compensationDate}
									max={new Date().toLocaleDateString("en-CA")}
									onChange={(event) => setCompensationDate(event.target.value)}
								/>
								<InputError message={errors.compensation_date} />
							</div>
							<div className="grid gap-2">
								<SelectField
									name="compensation_account_id"
									label="Paid into"
									placeholder="Choose an account"
									value={accountId}
									onValueChange={setAccountId}
									error={errors.account_id}>
									{accounts.map((account) => (
										<SelectItem
											key={account.id}
											value={String(account.id)}>
											{account.name}
										</SelectItem>
									))}
								</SelectField>
							</div>
							<div className="grid gap-2">
								<SelectField
									name="compensation_category_id"
									label="Income category"
									placeholder="Choose a category"
									value={categoryId}
									onValueChange={setCategoryId}
									error={errors.category_id}>
									{incomeCategories.map((category) => (
										<SelectItem
											key={category.id}
											value={String(category.id)}>
											{category.name}
										</SelectItem>
									))}
								</SelectField>
							</div>
						</div>
						<div className="grid gap-2">
							<Input
								id="compensation_notes"
								label="Note (optional)"
								placeholder="e.g. Reimbursed by employer"
								maxLength={250}
								value={notes}
								onChange={(event) => setNotes(event.target.value)}
							/>
							<InputError message={errors.notes} />
						</div>

						<DialogFooter className="gap-2">
							<DialogClose asChild>
								<Button
									type="button"
									variant="outline">
									Cancel
								</Button>
							</DialogClose>
							<Button
								type="submit"
								disabled={
									processing || amount <= 0 || !accountId || !categoryId
								}
								data-test="save-compensation-button">
								Add{" "}
								{amount > 0
									? formatAmount(amount, receipt.currency)
									: "compensation"}
								{processing && <Spinner />}
							</Button>
						</DialogFooter>
					</form>
				)}
			</DialogContent>
		</Dialog>
	)
}
