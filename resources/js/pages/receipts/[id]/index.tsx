import { useQuery } from "@tanstack/react-query"
import { useNavigate, useParams } from "@tanstack/react-router"
import { Head } from "@/lib/spa"
import { AlertCircle, ArrowLeft, CircleCheck, PencilLine, RotateCcw, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import Heading from "@/components/heading"
import ReceiptPreview from "@/components/receipts/receipt-preview"
import ReceiptProgress from "@/components/receipts/receipt-progress"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import Axios from "@/lib/axios"
import {
	cacheReceipt,
	forgetReceipt,
	receiptAccountsQuery,
	receiptCategoriesQuery,
	receiptQuery,
} from "@/lib/receipt-queries"
import { formatAmount } from "@/lib/receipts"
import { toast } from "@/lib/toast"
import { destroy, retry } from "@/routes/api/receipts"
import type { Receipt } from "@/types/receipt"

function ReceiptDetailsSkeleton() {
	return (
		<div
			className="space-y-4"
			aria-busy="true"
			aria-label="Loading receipt">
			<Skeleton className="h-5 w-1/2" />
			<Skeleton className="h-4 w-3/4" />
			<Skeleton className="h-10 w-full" />
			<Skeleton className="h-10 w-full" />
			<Skeleton className="h-10 w-2/3" />
		</div>
	)
}

export default function ReceiptReviewPage() {
	const { id } = useParams({ strict: false }) as { id: string }
	const navigate = useNavigate()

	// Starts from the list's copy (if any) and refreshes in the background.
	const { data: receipt, isError } = useQuery(receiptQuery(id))
	const { data: accounts = [] } = useQuery(receiptAccountsQuery())
	const { data: categories = [] } = useQuery(receiptCategoriesQuery())

	const [enteringManually, setEnteringManually] = useState(false)
	const [retrying, setRetrying] = useState(false)
	const [deleting, setDeleting] = useState(false)

	useEffect(() => {
		if (!isError) {
			return
		}

		toast.error("Receipt not found.")
		forgetReceipt(id)
		navigate({ to: "/receipts" })
	}, [isError, id, navigate])

	function handleRetry() {
		if (!receipt) {
			return
		}

		setRetrying(true)
		const { url, method } = retry(receipt.id)

		Axios.request<{ data: Receipt }>({ url, method })
			.then((response) => {
				setEnteringManually(false)
				cacheReceipt(response.data.data)
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
				forgetReceipt(receipt.id)
				navigate({ to: "/receipts" })
			})
			.catch(() => {
				toast.error("Couldn't delete the receipt.")
				setDeleting(false)
			})
	}

	// The list's copy has no line items, so the form and the added
	// transactions wait for the full receipt.
	const hasDetails = receipt?.items !== undefined
	const showForm =
		hasDetails && (receipt.status === "review" || (receipt.status === "failed" && enteringManually))
	const isLoadingDetails =
		!receipt ||
		(!hasDetails &&
			(receipt.status === "review" ||
				receipt.status === "confirmed" ||
				(receipt.status === "failed" && enteringManually)))

	return (
		<>
			<Head title={receipt?.merchant ?? "Receipt"} />

			<div className="flex flex-1 flex-col gap-6 p-4">
				<div className="flex items-center justify-between gap-4">
					<Link
						href="/receipts"
						variant="unstyled"
						className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
						<ArrowLeft className="size-4" />
						Receipts
					</Link>

					<Dialog>
						<DialogTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								disabled={deleting || !receipt}>
								<Trash2 />
								Delete
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogTitle>Delete this receipt?</DialogTitle>
							<DialogDescription>
								The receipt image is deleted.
								{receipt?.status === "confirmed" &&
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
						<ReceiptPreview
							receiptId={id}
							originalName={receipt?.originalName}
							scanning={receipt?.status === "processing"}
						/>
					</div>

					<div className="min-w-0 rounded-xl border bg-card p-6 shadow-sm">
						{isLoadingDetails && <ReceiptDetailsSkeleton />}

						{receipt?.status === "processing" && <ReceiptProgress receipt={receipt} />}

						{receipt?.status === "failed" && !enteringManually && (
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
										onConfirmed={cacheReceipt}
									/>
								</div>
							</>
						)}

						{receipt?.status === "confirmed" && hasDetails && (
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
											className="flex items-center justify-between gap-3 p-3">
											<div className="min-w-0">
												<p className="truncate">{transaction.notes ?? transaction.categoryName}</p>
												{transaction.notes && (
													<p className="text-xs text-muted-foreground">{transaction.categoryName}</p>
												)}
											</div>
											<span className="shrink-0 font-medium">
												{formatAmount(transaction.amount, receipt.currency)}
											</span>
										</li>
									))}
								</ul>
								<Link
									href="/transactions"
									variant="unstyled"
									className="text-sm font-medium text-primary transition-colors hover:text-primary/80">
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
