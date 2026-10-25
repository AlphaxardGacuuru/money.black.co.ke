import { useNavigate, useParams } from "@tanstack/react-router"
import { Head } from "@/lib/spa"
import { AlertCircle, ArrowLeft, CircleCheck, PencilLine, RotateCcw, Trash2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import Heading from "@/components/heading"
import ReceiptPreview from "@/components/receipts/receipt-preview"
import ReceiptReviewForm from "@/components/receipts/receipt-review-form"
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
import { Link } from "@/components/ui/link"
import { Spinner } from "@/components/ui/spinner"
import Axios from "@/lib/axios"
import { formatAmount } from "@/lib/receipts"
import { toast } from "@/lib/toast"
import { index as accountsIndex } from "@/routes/accounts"
import { index as categoriesIndex } from "@/routes/categories"
import { destroy, retry, show } from "@/routes/api/receipts"
import type { Account } from "@/types/account"
import type { Category } from "@/types/category"
import type { Receipt } from "@/types/receipt"

export default function ReceiptReviewPage() {
	const { id } = useParams({ strict: false }) as { id: string }
	const navigate = useNavigate()

	const [receipt, setReceipt] = useState<Receipt | null>(null)
	const [accounts, setAccounts] = useState<Account[]>([])
	const [categories, setCategories] = useState<Category[]>([])
	const [enteringManually, setEnteringManually] = useState(false)
	const [retrying, setRetrying] = useState(false)
	const [deleting, setDeleting] = useState(false)

	const fetchReceipt = useCallback(() => {
		return Axios.get<{ data: Receipt }>(show(id).url)
			.then((response) => setReceipt(response.data.data))
			.catch(() => {
				toast.error("Receipt not found.")
				navigate({ to: "/receipts" })
			})
	}, [id, navigate])

	useEffect(() => {
		fetchReceipt()

		Axios.get<{ data: Account[] }>(accountsIndex().url).then((response) => setAccounts(response.data.data))
		Axios.get<{ data: Category[] }>(categoriesIndex().url).then((response) =>
			setCategories(response.data.data.filter((category) => category.type === "expense"))
		)
	}, [fetchReceipt])

	useEffect(() => {
		if (receipt?.status !== "processing") {
			return
		}

		const timer = window.setInterval(fetchReceipt, 2000)

		return () => window.clearInterval(timer)
	}, [receipt?.status, fetchReceipt])

	function handleRetry() {
		if (!receipt) {
			return
		}

		setRetrying(true)
		const { url, method } = retry(receipt.id)

		Axios.request<{ data: Receipt }>({ url, method })
			.then((response) => {
				setEnteringManually(false)
				setReceipt(response.data.data)
			})
			.catch(() => toast.error("Couldn't retry. Please wait a minute and try again."))
			.finally(() => setRetrying(false))
	}

	function handleDelete() {
		if (!receipt) {
			return
		}

		setDeleting(true)
		const { url, method } = destroy(receipt.id)

		Axios.request<{ message: string }>({ url, method })
			.then((response) => {
				toast.success(response.data.message)
				navigate({ to: "/receipts" })
			})
			.catch(() => {
				toast.error("Couldn't delete the receipt.")
				setDeleting(false)
			})
	}

	if (!receipt) {
		return (
			<div className="flex flex-1 items-center justify-center p-8">
				<Spinner />
			</div>
		)
	}

	const showForm = receipt.status === "review" || (receipt.status === "failed" && enteringManually)

	return (
		<>
			<Head title={receipt.merchant ?? "Receipt"} />

			<div className="flex flex-1 flex-col gap-6 p-4">
				<div className="flex items-center justify-between gap-4">
					<Link
						href="/receipts"
						variant="text"
						size="none"
						className="flex items-center gap-1 text-sm">
						<ArrowLeft className="size-4" />
						Receipts
					</Link>

					<Dialog>
						<DialogTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								disabled={deleting}>
								<Trash2 />
								Delete
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogTitle>Delete this receipt?</DialogTitle>
							<DialogDescription>
								The receipt image is deleted.
								{receipt.status === "confirmed" &&
									" Transactions already added from it stay in your records."}
							</DialogDescription>
							<DialogFooter className="gap-2">
								<DialogClose asChild>
									<Button variant="outline">Cancel</Button>
								</DialogClose>
								<Button
									variant="destructive"
									disabled={deleting}
									onClick={handleDelete}>
									Delete
									{deleting && <Spinner />}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>

				<div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
					<div className="rounded-xl border bg-card p-4 shadow-sm">
						<ReceiptPreview receipt={receipt} />
					</div>

					<div className="min-w-0 rounded-xl border bg-card p-6 shadow-sm">
						{receipt.status === "processing" && (
							<div className="flex flex-col items-center gap-3 py-12 text-center">
								<Spinner className="size-6" />
								<p className="font-medium">Reading your receipt…</p>
								<p className="text-sm text-muted-foreground">
									This usually takes a few seconds. You can leave this page and come back.
								</p>
							</div>
						)}

						{receipt.status === "failed" && !enteringManually && (
							<div className="flex flex-col items-start gap-4">
								<div className="flex items-start gap-3">
									<AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
									<div>
										<p className="font-medium">We couldn't read this receipt</p>
										<p className="text-sm text-muted-foreground">{receipt.failureReason}</p>
									</div>
								</div>
								<div className="flex flex-wrap gap-3">
									<Button
										type="button"
										disabled={retrying}
										onClick={handleRetry}>
										{retrying ? <Spinner /> : <RotateCcw />}
										Try again
									</Button>
									<Button
										type="button"
										variant="outline"
										onClick={() => setEnteringManually(true)}>
										<PencilLine />
										Enter items manually
									</Button>
								</div>
							</div>
						)}

						{showForm && (
							<>
								<Heading
									variant="small"
									title="Check the details"
									description="Fix anything we misread and pick a category for each item. Nothing is added until you confirm."
								/>
								<div className="mt-6">
									<ReceiptReviewForm
										key={`${receipt.id}-${receipt.status}`}
										receipt={receipt}
										accounts={accounts}
										categories={categories}
										onConfirmed={setReceipt}
									/>
								</div>
							</>
						)}

						{receipt.status === "confirmed" && (
							<div className="space-y-4">
								<div className="flex items-center gap-2">
									<CircleCheck className="size-5 text-green-600" />
									<p className="font-medium">
										Added {receipt.merchant ? `from ${receipt.merchant}` : "to your records"}
									</p>
								</div>
								<ul className="divide-y rounded-lg border text-sm">
									{receipt.transactions?.map((transaction) => (
										<li
											key={transaction.id}
											className="flex justify-between p-3">
											<span>{transaction.categoryName}</span>
											<span className="font-medium">
												{formatAmount(transaction.amount, receipt.currency)}
											</span>
										</li>
									))}
								</ul>
								<Link
									href="/transactions"
									variant="text"
									size="none"
									className="text-sm">
									View transactions
								</Link>
							</div>
						)}
					</div>
				</div>
			</div>
		</>
	)
}

ReceiptReviewPage.layout = {
	breadcrumbs: [{ title: "Receipts", href: "/receipts" }],
}
