import { Head } from "@/lib/spa"
import { FileText, ReceiptText } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import Heading from "@/components/heading"
import { ReceiptProgressSummary } from "@/components/receipts/receipt-progress"
import ReceiptUploadButtons from "@/components/receipts/receipt-upload-buttons"
import { useSharedReceiptImport } from "@/hooks/use-shared-receipt-import"
import { Badge } from "@/components/ui/badge"
import { Link } from "@/components/ui/link"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { queryClient } from "@/lib/query-client"
import { receiptKeys, receiptListQuery } from "@/lib/receipt-queries"
import { formatAmount, receiptStatusLabels } from "@/lib/receipts"
import type { ReceiptStatus } from "@/types/receipt"

const statusVariants: Record<ReceiptStatus, "default" | "secondary" | "destructive" | "outline"> = {
	processing: "secondary",
	review: "default",
	confirmed: "outline",
	failed: "destructive",
}

function refreshReceipts() {
	queryClient.invalidateQueries({ queryKey: receiptKeys.list() })
}

export default function ReceiptsPage() {
	// Shows the cached list straight away and refreshes it in the background;
	// polls while any receipt is still being read.
	const { data: receipts = [], isPending: loading } = useQuery(receiptListQuery())

	const { importing } = useSharedReceiptImport(refreshReceipts)

	return (
		<>
			<Head title="Receipts" />

			<ReceiptUploadButtons />

			{/* Bottom padding keeps the last receipt clear of the floating buttons. */}
			<div className="flex flex-1 flex-col gap-6 pb-48 md:pb-28">
				<div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
					<Heading
						title="Receipts"
						description="Scan or upload a receipt and we'll read the items and sort them into your categories. You review everything before it's added."
					/>
					{importing && (
						<p className="flex items-center gap-2 text-sm text-muted-foreground">
							<Spinner /> Uploading the receipt you shared…
						</p>
					)}
				</div>

				{loading ? (
					<ul
						className="divide-y rounded-xl border bg-card shadow-sm"
						aria-busy="true"
						aria-label="Loading receipts">
						{[0, 1, 2].map((row) => (
							<li
								key={row}
								className="flex items-center justify-between gap-4 p-4">
								<div className="flex items-center gap-3">
									<Skeleton className="size-5" />
									<div className="space-y-2">
										<Skeleton className="h-4 w-36" />
										<Skeleton className="h-3 w-24" />
									</div>
								</div>
								<Skeleton className="h-5 w-20 rounded-full" />
							</li>
						))}
					</ul>
				) : receipts.length === 0 ? (
					<div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center text-muted-foreground">
						<ReceiptText className="size-8" />
						<p className="text-sm">No receipts yet. Tap the camera button to scan your first one.</p>
					</div>
				) : (
					<ul className="divide-y rounded-xl border bg-card shadow-sm">
						{receipts.map((receipt) => (
							<li key={receipt.id}>
								<Link
									href={`/receipts/${receipt.id}`}
									variant="unstyled"
									className="flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-accent/50">
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
											{receipt.status === "processing" && <ReceiptProgressSummary receipt={receipt} />}
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
