import { FilterIcon } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SelectField, SelectItem } from "@/components/ui/select"
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet"
import type { Account } from "@/types/account"
import type { Category } from "@/types/category"

export type TransactionFilters = {
	accountId?: string
	categoryId?: string
	notes?: string
	amount?: string
}

type Props = {
	filters: TransactionFilters
	accounts: Account[]
	categories: Category[]
	onApply: (filters: TransactionFilters) => void
}

export default function TransactionFilterSheet({
	filters,
	accounts,
	categories,
	onApply,
}: Props) {
	const [open, setOpen] = useState(false)
	const [local, setLocal] = useState<TransactionFilters>(filters)

	const activeCount = Object.values(filters).filter(Boolean).length

	function handleApply() {
		onApply(local)
		setOpen(false)
	}

	function handleClear() {
		const cleared: TransactionFilters = {}
		setLocal(cleared)
		onApply(cleared)
		setOpen(false)
	}

	function handleOpenChange(value: boolean) {
		if (value) {
			setLocal(filters)
		}

		setOpen(value)
	}

	return (
		<Sheet
			open={open}
			onOpenChange={handleOpenChange}>
			<SheetTrigger
				asChild
				className="w-full">
				<Button
					className="w-50 rounded-3xl"
					variant="outline">
					<FilterIcon className="size-4" />
					<span>Filter</span>
					{activeCount > 0 && (
						<span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
							{activeCount}
						</span>
					)}
				</Button>
			</SheetTrigger>
			<SheetContent
				side="bottom"
				className="rounded-t-3xl">
				<SheetHeader>
					<SheetTitle>Filter Transactions</SheetTitle>
				</SheetHeader>

				<div className="space-y-4 px-4 pb-4">
					{/* Account */}
					<SelectField
						label="Account"
						value={local.accountId ?? ""}
						onValueChange={(value) =>
							setLocal((prev) => ({
								...prev,
								accountId: value === "all" ? undefined : value,
							}))
						}>
						<SelectItem value="all">All accounts</SelectItem>
						{accounts.map((account) => (
							<SelectItem
								key={account.id}
								value={String(account.id)}>
								{account.name}
							</SelectItem>
						))}
					</SelectField>

					{/* Category */}
					<SelectField
						label="Category"
						value={local.categoryId ?? ""}
						onValueChange={(value) =>
							setLocal((prev) => ({
								...prev,
								categoryId: value === "all" ? undefined : value,
							}))
						}>
						<SelectItem value="all">All categories</SelectItem>
						{categories.map((category) => (
							<SelectItem
								key={category.id}
								value={String(category.id)}>
								{category.name}
							</SelectItem>
						))}
					</SelectField>

					{/* Notes */}
					<Input
						label="Notes"
						value={local.notes}
						onChange={(e) =>
							setLocal((prev) => ({
								...prev,
								notes: e.target.value || undefined,
							}))
						}
					/>

					{/* Amount */}
					<Input
						label="Amount"
						type="number"
						min={0}
						value={local.amount}
						onChange={(e) =>
							setLocal((prev) => ({
								...prev,
								amount: e.target.value || undefined,
							}))
						}
					/>

					{/* Actions */}
					<div className="flex flex-col gap-2 pt-2">
						<Button
							className="flex-1"
							onClick={handleApply}>
							Apply
						</Button>
						<Button
							variant="outline"
							className="flex-1"
							onClick={handleClear}
							title="Clear filters">
							Clear
						</Button>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	)
}
