import { Form, Link } from "@inertiajs/react"
import { Calendar, Check, Shapes, Wallet } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import AccountController from "@/actions/App/Http/Controllers/AccountController"
import CategoryController from "@/actions/App/Http/Controllers/CategoryController"
import TransactionController from "@/actions/App/Http/Controllers/TransactionController"
import InputError from "@/components/input-error"
import LucideIconDisplay from "@/components/lucide-icon-display"
import { useInitials } from "@/hooks/use-initials"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"

type Category = {
	id: number | string
	name: string
	color?: string | null
	icon?: string | null
}

type Account = {
	id: number | string
	name: string
	icon?: string | null
	color?: string | null
	currency?: string | null
	isDefault?: boolean
}

type AddTransactionSheetProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
	selectedCategory: Category | null
	onSelectedCategoryChange: (category: Category | null) => void
	categories: Category[]
	accounts: Account[]
	redirectTo?: string
	transaction?: {
		id: number | string
		amount: number | string
		notes?: string | null
		transaction_date?: string | null
		account_id: number | string
		category_id: number | string
	} | null
}

function getDefaultAccount(accounts: Account[]): Account | null {
	if (accounts.length === 0) {
		return null
	}

	const explicitDefault = accounts.find((account) => account.isDefault === true)

	return explicitDefault ?? accounts[0] ?? null
}

function getDefaultTransactionDate(): string {
	return new Date().toISOString().slice(0, 10)
}

function getTransactionDateValue(
	transaction?: AddTransactionSheetProps["transaction"]
): string {
	if (!transaction?.transaction_date) {
		return getDefaultTransactionDate()
	}

	return transaction.transaction_date.slice(0, 10)
}

function getTransactionAmountValue(
	transaction?: AddTransactionSheetProps["transaction"]
): string {
	if (!transaction) {
		return ""
	}

	const amount = Number(transaction.amount ?? 0)

	if (Number.isNaN(amount) || amount <= 0) {
		return ""
	}

	return String(amount)
}

function getTransactionAccount(
	accounts: Account[],
	transaction?: AddTransactionSheetProps["transaction"]
): Account | null {
	if (transaction) {
		const matchedAccount = accounts.find(
			(account) => String(account.id) === String(transaction.account_id)
		)

		if (matchedAccount) {
			return matchedAccount
		}
	}

	return getDefaultAccount(accounts)
}

function formatDisplayDate(dateStr: string): string {
	const d = new Date(dateStr + "T00:00:00")

	return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function resolveCardColor(
	color: string | null | undefined,
	index: number
): string {
	const fallbackColors = [
		"#0ea5e9",
		"#10b981",
		"#f97316",
		"#e11d48",
		"#8b5cf6",
		"#14b8a6",
		"#f59e0b",
	]

	if (typeof color === "string" && color.trim() !== "") {
		return color
	}

	return fallbackColors[index % fallbackColors.length]
}

export default function AddTransactionSheet({
	open,
	onOpenChange,
	selectedCategory,
	onSelectedCategoryChange,
	categories,
	accounts,
	redirectTo = "/categories",
	transaction = null,
}: AddTransactionSheetProps) {
	const getInitials = useInitials()
	const [selectedAccount, setSelectedAccount] = useState<Account | null>(
		getTransactionAccount(accounts, transaction)
	)
	const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false)
	const [isAccountPickerOpen, setIsAccountPickerOpen] = useState(false)
	const [calcDisplay, setCalcDisplay] = useState(
		getTransactionAmountValue(transaction)
	)
	const [transactionDate, setTransactionDate] = useState(
		getTransactionDateValue(transaction)
	)
	const dateInputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		if (!open) {
			return
		}

		setSelectedAccount(getTransactionAccount(accounts, transaction))
		setIsCategoryPickerOpen(false)
		setIsAccountPickerOpen(false)
		setCalcDisplay(getTransactionAmountValue(transaction))
		setTransactionDate(getTransactionDateValue(transaction))
	}, [accounts, open, transaction])

	function safeEval(expr: string): number {
		const tokens = expr.match(/[\d]+|[+\-*/]/g) ?? []
		let i = 0

		function parseExpr(): number {
			let left = parseTerm()

			while (i < tokens.length && (tokens[i] === "+" || tokens[i] === "-")) {
				const op = tokens[i++]
				const right = parseTerm()
				left = op === "+" ? left + right : left - right
			}

			return left
		}

		function parseTerm(): number {
			let left = parseNum()

			while (i < tokens.length && (tokens[i] === "*" || tokens[i] === "/")) {
				const op = tokens[i++]
				const right = parseNum()
				left = op === "*" ? left * right : right !== 0 ? left / right : 0
			}

			return left
		}

		function parseNum(): number {
			const tok = tokens[i++]

			return isNaN(Number(tok)) ? 0 : Number(tok)
		}

		return parseExpr()
	}

	function handleCalcKey(key: string): void {
		const operators = ["+", "-", "*", "/"]

		setCalcDisplay((prev) => {
			if (key === "⌫") {
				return prev.slice(0, -1)
			}

			if (operators.includes(key)) {
				if (!prev) {
					return prev
				}

				if (operators.includes(prev.slice(-1))) {
					return prev.slice(0, -1) + key
				}

				return prev + key
			}

			if (prev === "0") {
				return key
			}

			return (prev || "") + key
		})
	}

	const resolvedAmount = calcDisplay
		? Math.max(0, Math.trunc(safeEval(calcDisplay)))
		: 0
	const canSubmit = Boolean(
		selectedCategory && selectedAccount && resolvedAmount > 0
	)
	const sheetTitle = transaction ? "Edit Transaction" : "Add Transaction"
	const formAction = transaction?.id
		? TransactionController.update["/transactions/{transaction}"].form(
				transaction.id
			)
		: TransactionController.store["/transactions"].form()

	return (
		<Sheet
			open={open}
			onOpenChange={(nextOpen) => {
				onOpenChange(nextOpen)

				if (!nextOpen) {
					setIsCategoryPickerOpen(false)
					setIsAccountPickerOpen(false)
					setCalcDisplay(getTransactionAmountValue(transaction))
					setTransactionDate(getTransactionDateValue(transaction))
				}
			}}>
			<SheetContent
				side="bottom"
				className="max-h-[85vh] rounded-t-3xl [&>button]:top-1 [&>button]:right-0 [&>button]:left-auto [&>button]:size-11 [&>button>svg]:size-6">
				<SheetHeader>
					<SheetTitle>{sheetTitle}</SheetTitle>
				</SheetHeader>

				{accounts.length > 0 ? (
					categories.length > 0 ? (
						<Form
							{...formAction}
							options={{ preserveScroll: true }}
							resetOnSuccess={!transaction}
							onSuccess={() => {
								onOpenChange(false)
								onSelectedCategoryChange(null)
								setCalcDisplay(getTransactionAmountValue(null))
								setTransactionDate(getTransactionDateValue(null))
							}}
							className="grid gap-4 px-4 pb-4">
							{({ processing, errors }) => (
								<>
									<input
										type="hidden"
										name="category_id"
										value={selectedCategory ? String(selectedCategory.id) : ""}
									/>
									<input
										type="hidden"
										name="account_id"
										value={selectedAccount ? String(selectedAccount.id) : ""}
									/>
									<input
										type="hidden"
										name="redirect_to"
										value={redirectTo}
									/>

									<div className="">
										<div className="flex items-center justify-between gap-1">
											<button
												type="button"
												onClick={() => {
													setIsAccountPickerOpen(
														(isPickerOpen) => !isPickerOpen
													)
													setIsCategoryPickerOpen(false)
												}}
												className="inline-flex grow items-center gap-2 rounded-xl border border-border/70 bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent/20">
												<div
													className="flex size-12 items-center justify-center rounded-full border border-border/60 text-white"
													style={{
														backgroundColor:
															selectedAccount?.color ?? "#0f172a",
													}}>
													<LucideIconDisplay
														icon={selectedAccount?.icon}
														className="size-6"
														fallback={<Wallet className="size-6" />}
													/>
												</div>
												<div className="flex flex-col items-start gap-1">
													<span className="text-[10px]">From Account</span>
													<span className="max-w-28 truncate text-sm">
														{selectedAccount?.name ?? "Select account"}
													</span>
												</div>
											</button>

											<button
												type="button"
												onClick={() => {
													setIsCategoryPickerOpen(
														(isPickerOpen) => !isPickerOpen
													)
													setIsAccountPickerOpen(false)
												}}
												className="inline-flex grow items-center gap-2 rounded-xl border border-border/70 bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent/20">
												<div
													className="flex size-12 items-center justify-center rounded-full border border-border/60 text-white"
													style={{
														backgroundColor:
															selectedCategory?.color ?? "#0f172a",
													}}>
													<LucideIconDisplay
														icon={selectedCategory?.icon}
														className="size-6"
														fallback={
															<span className="text-[10px] font-semibold">
																{getInitials(
																	selectedCategory?.name ?? "Category"
																) || "C"}
															</span>
														}
													/>
												</div>
												<div className="flex flex-col items-start gap-1">
													<span className="text-[10px]">From Category</span>
													<span className="max-w-28 truncate text-sm">
														{selectedCategory?.name ?? "Select category"}
													</span>
												</div>
											</button>
										</div>

										{isAccountPickerOpen ? (
											<div className="mt-3 grid grid-cols-4 gap-2 rounded-xl border bg-gray-500/10 p-1">
												{accounts.map((account, accountIndex) => (
													<button
														key={account.id}
														type="button"
														onClick={() => {
															setSelectedAccount(account)
															setIsAccountPickerOpen(false)
														}}
														className={`flex min-h-24 flex-col rounded-xl border p-2 text-center transition-colors hover:bg-accent/20 ${
															selectedAccount?.id === account.id
																? "border-primary/70 bg-primary/10"
																: "border-border/70 bg-background"
														}`}>
														<div className="flex flex-1 items-center justify-center">
															<div
																className="flex size-8 items-center justify-center rounded-full border border-border/60 text-white"
																style={{
																	backgroundColor: resolveCardColor(
																		account.color,
																		accountIndex
																	),
																}}>
																<LucideIconDisplay
																	icon={account.icon}
																	className="size-3"
																	fallback={
																		<span className="text-[10px] font-semibold">
																			{getInitials(account.name) || "A"}
																		</span>
																	}
																/>
															</div>
														</div>
														<p className="truncate text-[11px] font-medium">
															{account.name}
														</p>
													</button>
												))}
											</div>
										) : null}

										{isCategoryPickerOpen ? (
											<div className="mt-3 grid grid-cols-4 gap-2 rounded-xl border bg-gray-500/10 p-1">
												{categories.map((category, categoryIndex) => (
													<button
														key={category.id}
														type="button"
														onClick={() => {
															onSelectedCategoryChange(category)
															setIsCategoryPickerOpen(false)
														}}
														className={`flex min-h-24 flex-col rounded-xl border p-2 text-center transition-colors hover:bg-accent/20 ${
															selectedCategory?.id === category.id
																? "border-primary/70 bg-primary/10"
																: "border-border/70 bg-background"
														}`}>
														<div className="flex flex-1 items-center justify-center">
															<div
																className="flex size-8 items-center justify-center rounded-full border border-border/60 text-white"
																style={{
																	backgroundColor: resolveCardColor(
																		category.color,
																		categoryIndex
																	),
																}}>
																<LucideIconDisplay
																	icon={category.icon}
																	className="size-3"
																	fallback={
																		<span className="text-[10px] font-semibold">
																			{getInitials(category.name) || "C"}
																		</span>
																	}
																/>
															</div>
														</div>
														<p className="truncate text-[11px] font-medium">
															{category.name}
														</p>
													</button>
												))}
											</div>
										) : null}
									</div>
									<InputError message={errors.account_id} />
									<InputError message={errors.category_id} />

									<div className="grid gap-2">
										<Input
											id="notes"
											name="notes"
											placeholder="Notes"
											defaultValue={transaction?.notes ?? ""}
										/>
										<InputError message={errors.notes} />
									</div>

									<div className="space-y-2">
										<input
											type="hidden"
											name="amount"
											value={String(resolvedAmount)}
										/>
										<input
											ref={dateInputRef}
											type="date"
											name="transaction_date"
											value={transactionDate}
											onChange={(e) => setTransactionDate(e.target.value)}
											className="sr-only"
											required
										/>
										<InputError message={errors.amount} />
										<InputError message={errors.transaction_date} />

										<div className="rounded-2xl border border-border/60 bg-muted/40 px-5 py-3 text-right">
											<p className="mb-1 text-xs tracking-widest text-muted-foreground uppercase">
												Amount
											</p>
											<p className="text-2xl font-medium tracking-tight break-all text-muted-foreground tabular-nums">
												{calcDisplay || "0"}
											</p>
											<p className="mt-0.5 text-4xl font-bold tracking-tight tabular-nums">
												{resolvedAmount ? resolvedAmount.toLocaleString() : "0"}
											</p>
										</div>

										<div className="grid grid-cols-5 gap-2">
											<button
												type="button"
												onClick={() => handleCalcKey("/")}
												className="flex h-14 items-center justify-center rounded-2xl bg-primary/10 text-lg font-bold text-primary transition-all hover:bg-primary/20 active:scale-[0.95]">
												÷
											</button>

											{["7", "8", "9"].map((d) => (
												<button
													key={d}
													type="button"
													onClick={() => handleCalcKey(d)}
													className="flex h-14 items-center justify-center rounded-2xl bg-muted text-lg font-semibold transition-all hover:bg-muted/70 active:scale-[0.95]">
													{d}
												</button>
											))}

											<button
												type="button"
												onClick={() => handleCalcKey("⌫")}
												className="flex h-14 items-center justify-center rounded-2xl bg-muted/50 text-lg font-semibold transition-all hover:bg-muted active:scale-[0.95]">
												⌫
											</button>

											<button
												type="button"
												onClick={() => handleCalcKey("*")}
												className="flex h-14 items-center justify-center rounded-2xl bg-primary/10 text-lg font-bold text-primary transition-all hover:bg-primary/20 active:scale-[0.95]">
												×
											</button>

											{["4", "5", "6"].map((d) => (
												<button
													key={d}
													type="button"
													onClick={() => handleCalcKey(d)}
													className="flex h-14 items-center justify-center rounded-2xl bg-muted text-lg font-semibold transition-all hover:bg-muted/70 active:scale-[0.95]">
													{d}
												</button>
											))}

											<button
												type="button"
												onClick={() => dateInputRef.current?.showPicker?.()}
												className="flex h-14 flex-col items-center justify-center gap-0.5 rounded-2xl bg-muted/50 text-xs leading-tight font-semibold transition-all hover:bg-muted active:scale-[0.95]">
												<Calendar className="size-4" />
												<span>{formatDisplayDate(transactionDate)}</span>
											</button>

											<button
												type="button"
												onClick={() => handleCalcKey("-")}
												className="flex h-14 items-center justify-center rounded-2xl bg-primary/10 text-lg font-bold text-primary transition-all hover:bg-primary/20 active:scale-[0.95]">
												−
											</button>

											{["1", "2", "3"].map((d) => (
												<button
													key={d}
													type="button"
													onClick={() => handleCalcKey(d)}
													className="flex h-14 items-center justify-center rounded-2xl bg-muted text-lg font-semibold transition-all hover:bg-muted/70 active:scale-[0.95]">
													{d}
												</button>
											))}

											<button
												type="submit"
												disabled={processing || !canSubmit}
												className="row-span-2 flex items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.95] disabled:cursor-not-allowed disabled:opacity-50">
												{processing ? (
													<Spinner />
												) : (
													<Check className="size-5" />
												)}
											</button>
											<button
												type="button"
												onClick={() => handleCalcKey("+")}
												className="flex h-14 items-center justify-center rounded-2xl bg-primary/10 text-lg font-bold text-primary transition-all hover:bg-primary/20 active:scale-[0.95]">
												+
											</button>

											<button
												type="button"
												onClick={() => handleCalcKey("0")}
												className="flex h-14 items-center justify-center rounded-2xl bg-muted text-lg font-semibold transition-all hover:bg-muted/70 active:scale-[0.95]">
												0
											</button>
											<button
												type="button"
												onClick={() => onOpenChange(false)}
												className="col-span-2 flex h-14 items-center justify-center rounded-2xl bg-destructive/10 text-sm font-semibold text-destructive transition-all hover:bg-destructive/20 active:scale-[0.95]">
												Cancel
											</button>
										</div>
									</div>
								</>
							)}
						</Form>
					) : (
						<div className="grid gap-4 px-4 pb-4">
							<div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
								Add a category before recording transactions.
							</div>
							<div className="flex justify-end">
								<Button asChild>
									<Link href={CategoryController.index["/categories"].url()}>
										<Shapes className="size-4" />
										Go to Categories
									</Link>
								</Button>
							</div>
						</div>
					)
				) : (
					<div className="grid gap-4 px-4 pb-4">
						<div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
							Add an account before recording transactions.
						</div>
						<div className="flex justify-end">
							<Button asChild>
								<Link href={AccountController.create.url()}>
									<Wallet className="size-4" />
									Create Account
								</Link>
							</Button>
						</div>
					</div>
				)}
			</SheetContent>
		</Sheet>
	)
}
