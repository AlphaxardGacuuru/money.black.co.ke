import { Plus, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"
import InputError from "@/components/input-error"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SelectField, SelectItem } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import Axios from "@/lib/axios"
import { allocateTotal, formatAmount } from "@/lib/receipts"
import { toast } from "@/lib/toast"
import { confirm } from "@/routes/api/receipts"
import type { Account } from "@/types/account"
import type { Category } from "@/types/category"
import type { Receipt, ReceiptItem } from "@/types/receipt"

type Props = {
	receipt: Receipt
	accounts: Account[]
	categories: Category[]
	onConfirmed: (receipt: Receipt) => void
}

const emptyItem = (): ReceiptItem => ({
	description: "",
	quantity: 1,
	amount: 0,
	categoryId: null,
})

export default function ReceiptReviewForm({ receipt, accounts, categories, onConfirmed }: Props) {
	const [merchant, setMerchant] = useState(receipt.merchant ?? "")
	const [receiptDate, setReceiptDate] = useState(
		receipt.receiptDate ?? new Date().toISOString().slice(0, 10)
	)
	const [accountId, setAccountId] = useState(
		receipt.accountId ?? String(accounts.find((account) => account.isDefault)?.id ?? accounts[0]?.id ?? "")
	)
	const [items, setItems] = useState<ReceiptItem[]>(
		receipt.items && receipt.items.length > 0 ? receipt.items : [emptyItem()]
	)
	const [total, setTotal] = useState<number>(
		receipt.total ?? receipt.items?.reduce((sum, item) => sum + item.amount, 0) ?? 0
	)
	const [errors, setErrors] = useState<Record<string, string>>({})
	const [processing, setProcessing] = useState(false)

	const categoryNames = useMemo(
		() => Object.fromEntries(categories.map((category) => [String(category.id), category.name])),
		[categories]
	)

	const itemsTotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
	const difference = total - itemsTotal
	const uncategorisedCount = items.filter((item) => !item.categoryId).length

	const breakdown = useMemo(() => {
		const subtotals: Record<string, number> = {}

		for (const item of items) {
			if (item.categoryId) {
				subtotals[item.categoryId] = (subtotals[item.categoryId] ?? 0) + (Number(item.amount) || 0)
			}
		}

		return allocateTotal(subtotals, uncategorisedCount === 0 ? total : itemsTotal)
	}, [items, total, itemsTotal, uncategorisedCount])

	function updateItem(index: number, changes: Partial<ReceiptItem>) {
		setItems((current) =>
			current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...changes } : item))
		)
	}

	function removeItem(index: number) {
		setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))
	}

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setProcessing(true)
		setErrors({})

		const { url, method } = confirm(receipt.id)

		Axios.request<{ data: Receipt; message: string }>({
			url,
			method,
			data: {
				account_id: accountId,
				merchant: merchant || null,
				receipt_date: receiptDate,
				total,
				items: items.map((item) => ({
					description: item.description,
					quantity: item.quantity,
					amount: Number(item.amount) || 0,
					category_id: item.categoryId,
				})),
			},
		})
			.then((response) => {
				toast.success(response.data.message)
				onConfirmed(response.data.data)
			})
			.catch((error: unknown) => {
				const e = error as {
					response?: { status?: number; data?: { errors?: Record<string, string[]> } }
				}

				if (e.response?.status === 422) {
					const raw = e.response.data?.errors ?? {}
					setErrors(Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, value[0]])))
					toast.error(Object.values(raw)[0]?.[0] ?? "Please fix the highlighted fields.")

					return
				}

				toast.error("Something went wrong. Please try again.")
			})
			.finally(() => setProcessing(false))
	}

	return (
		<form
			onSubmit={handleSubmit}
			className="space-y-6"
			aria-busy={processing}>
			<div className="grid gap-4 sm:grid-cols-2">
				<div className="grid gap-2">
					<Input
						id="merchant"
						label="Shop"
						value={merchant}
						onChange={(event) => setMerchant(event.target.value)}
					/>
					<InputError message={errors.merchant} />
				</div>
				<div className="grid gap-2">
					<Input
						id="receipt_date"
						type="date"
						label="Date"
						value={receiptDate}
						max={new Date().toISOString().slice(0, 10)}
						onChange={(event) => setReceiptDate(event.target.value)}
					/>
					<InputError message={errors.receipt_date} />
				</div>
				<div className="grid gap-2">
					<SelectField
						name="account_id"
						label="Paid from"
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
					<Input
						id="total"
						type="number"
						inputMode="numeric"
						min={1}
						label={`Total paid (${receipt.currency})`}
						value={total || ""}
						onChange={(event) => setTotal(Math.round(Number(event.target.value)) || 0)}
					/>
					<InputError message={errors.total} />
				</div>
			</div>

			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<h3 className="text-sm font-medium">Items</h3>
					{uncategorisedCount > 0 && (
						<span className="text-xs text-amber-600 dark:text-amber-400">
							{uncategorisedCount} without a category
						</span>
					)}
				</div>

				<ul className="space-y-3">
					{items.map((item, index) => (
						<li
							key={item.id ?? `new-${index}`}
							className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_7rem_12rem_auto] sm:items-start">
							<div className="grid gap-1">
								<Input
									id={`items-${index}-description`}
									label="Item"
									value={item.description}
									onChange={(event) => updateItem(index, { description: event.target.value })}
								/>
								<InputError message={errors[`items.${index}.description`]} />
							</div>
							<div className="grid gap-1">
								<Input
									id={`items-${index}-amount`}
									type="number"
									inputMode="numeric"
									min={1}
									label="Amount"
									value={item.amount || ""}
									onChange={(event) =>
										updateItem(index, { amount: Math.round(Number(event.target.value)) || 0 })
									}
								/>
								<InputError message={errors[`items.${index}.amount`]} />
							</div>
							<SelectField
								name={`items.${index}.category_id`}
								label="Category"
								placeholder="Choose"
								value={item.categoryId ?? ""}
								onValueChange={(value) => updateItem(index, { categoryId: value })}
								error={errors[`items.${index}.category_id`]}>
								{categories.map((category) => (
									<SelectItem
										key={category.id}
										value={String(category.id)}>
										{category.name}
									</SelectItem>
								))}
							</SelectField>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								aria-label={`Remove ${item.description || "item"}`}
								disabled={items.length === 1}
								onClick={() => removeItem(index)}>
								<Trash2 />
							</Button>
						</li>
					))}
				</ul>

				<Button
					type="button"
					variant="outline"
					onClick={() => setItems((current) => [...current, emptyItem()])}>
					<Plus />
					Add item
				</Button>
				<InputError message={errors.items} />
			</div>

			<div className="space-y-2 rounded-lg bg-muted/50 p-4 text-sm">
				<div className="flex justify-between">
					<span className="text-muted-foreground">Items add up to</span>
					<span>{formatAmount(itemsTotal, receipt.currency)}</span>
				</div>
				{difference !== 0 && (
					<p className="text-xs text-muted-foreground">
						The {formatAmount(Math.abs(difference), receipt.currency)}{" "}
						{difference > 0 ? "extra (tax, fees)" : "discount"} will be shared across the
						categories so the transactions add up to the total paid.
					</p>
				)}
				{Object.keys(breakdown).length > 0 && (
					<ul className="space-y-1 border-t pt-2">
						{Object.entries(breakdown).map(([categoryId, amount]) => (
							<li
								key={categoryId}
								className="flex justify-between">
								<span>{categoryNames[categoryId] ?? "Category"}</span>
								<span className="font-medium">{formatAmount(amount, receipt.currency)}</span>
							</li>
						))}
					</ul>
				)}
			</div>

			<Button
				type="submit"
				className="w-full sm:w-auto"
				disabled={processing || accounts.length === 0}
				data-test="confirm-receipt-button">
				Add {Object.keys(breakdown).length || ""} transaction
				{Object.keys(breakdown).length === 1 ? "" : "s"}
				{processing && <Spinner />}
			</Button>
			{accounts.length === 0 && (
				<p className="text-sm text-muted-foreground">Create an account first to add these transactions.</p>
			)}
		</form>
	)
}
