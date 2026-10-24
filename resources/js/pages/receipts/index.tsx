import { Head } from "@/lib/spa"
import { FileText, ReceiptText } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import Heading from "@/components/heading"
import ReceiptUploadButtons from "@/components/receipts/receipt-upload-buttons"
import { useSharedReceiptImport } from "@/hooks/use-shared-receipt-import"
import { Badge } from "@/components/ui/badge"
import { Link } from "@/components/ui/link"
import { Spinner } from "@/components/ui/spinner"
import Axios from "@/lib/axios"
import { formatAmount, receiptStatusLabels } from "@/lib/receipts"
import { index } from "@/routes/api/receipts"
import type { Receipt, ReceiptStatus } from "@/types/receipt"

const statusVariants: Record<ReceiptStatus, "default" | "secondary" | "destructive" | "outline"> = {
	processing: "secondary",
	review: "default",
	confirmed: "outline",
	failed: "destructive",
}

export default function ReceiptsPage() {
	const [receipts, setReceipts] = useState<Receipt[]>([])
	const [loading, setLoading] = useState(true)

	const fetchReceipts = useCallback(() => {
		return Axios.get<{ data: Receipt[] }>(index().url)
			.then((response) => setReceipts(response.data.data))
			.finally(() => setLoading(false))
	}, [])

	useEffect(() => {
		fetchReceipts()
	}, [fetchReceipts])

	const { importing } = useSharedReceiptImport(fetchReceipts)

	const hasProcessing = receipts.some((receipt) => receipt.status === "processing")

	useEffect(() => {
		if (!hasProcessing) {
			return
		}

		const timer = window.setInterval(fetchReceipts, 3000)

		return () => window.clearInterval(timer)
	}, [hasProcessing, fetchReceipts])

	return (
		<>
			<Head title="Receipts" />

			<div className="flex flex-1 flex-col gap-6 p-4">
				<div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
					<Heading
						title="Receipts"
						description="Scan or upload a receipt and we'll read the items and sort them into your categories. You review everything before it's added."
					/>
					<ReceiptUploadButtons />
					{importing && (
						<p className="flex items-center gap-2 text-sm text-muted-foreground">
							<Spinner /> Uploading the receipt you shared…
						</p>
					)}
				</div>

				{loading ? (
					<div className="flex justify-center py-8">
						<Spinner />
					</div>
				) : receipts.length === 0 ? (
					<div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center text-muted-foreground">
						<ReceiptText className="size-8" />
						<p className="text-sm">No receipts yet. Scan your first one above.</p>
					</div>
				) : (
					<ul className="divide-y rounded-xl border bg-card shadow-sm">
						{receipts.map((receipt) => (
							<li key={receipt.id}>
								<Link
									href={`/receipts/${receipt.id}`}
									variant="text"
									size="none"
									className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-accent/50">
									<div className="flex min-w-0 items-center gap-3">
										{receipt.isPdf ? (
											<FileText className="size-5 shrink-0 text-muted-foreground" />
										) : (
											<ReceiptText className="size-5 shrink-0 text-muted-foreground" />
										)}
										<div className="min-w-0">
											<p className="truncate text-sm font-medium text-foreground">
												{receipt.merchant ?? receipt.originalName ?? "Receipt"}
											</p>
											<p className="text-xs text-muted-foreground">
												{receipt.receiptDate ??
													new Date(receipt.createdAt).toLocaleDateString("en-KE")}
												{receipt.itemsCount ? ` · ${receipt.itemsCount} items` : ""}
											</p>
										</div>
									</div>
									<div className="flex shrink-0 flex-col items-end gap-1">
										{receipt.total ? (
											<span className="text-sm font-semibold text-foreground">
												{formatAmount(receipt.total, receipt.currency)}
											</span>
										) : null}
										<Badge variant={statusVariants[receipt.status]}>
											{receipt.status === "processing" && <Spinner className="size-3" />}
											{receiptStatusLabels[receipt.status]}
										</Badge>
									</div>
								</Link>
							</li>
						))}
					</ul>
				)}
			</div>
		</>
	)
}

ReceiptsPage.layout = {
	breadcrumbs: [{ title: "Receipts", href: "/receipts" }],
}
