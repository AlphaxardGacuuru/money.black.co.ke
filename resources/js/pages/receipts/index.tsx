import { Head } from "@/lib/spa"
import { Camera, FileText, ReceiptText, Upload } from "lucide-react"
import { useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import Heading from "@/components/heading"
import { ReceiptProgressSummary } from "@/components/receipts/receipt-progress"
import { useSharedReceiptImport } from "@/hooks/use-shared-receipt-import"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Link } from "@/components/ui/link"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { queryClient } from "@/lib/query-client"
import { receiptKeys, receiptListQuery } from "@/lib/receipt-queries"
import {
	ACCEPTED_RECEIPT_TYPES,
	formatAmount,
	receiptStatusLabels,
	receiptUploadErrorMessage,
	uploadReceiptFile,
} from "@/lib/receipts"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { useFabPosition } from "@/hooks/use-fab-position"
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

	const navigate = useNavigate()
	const cameraInput = useRef<HTMLInputElement>(null)
	const fileInput = useRef<HTMLInputElement>(null)
	const [uploading, setUploading] = useState(false)
	const fabPosition = useFabPosition()

	async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
		const selected = event.target.files?.[0]
		event.target.value = ""

		if (!selected) {
			return
		}

		setUploading(true)

		try {
			const { receipt, message } = await uploadReceiptFile(selected)

			toast.success(message)
			navigate({ to: `/receipts/${receipt.id}` })
		} catch (error: unknown) {
			toast.error(receiptUploadErrorMessage(error))
		} finally {
			setUploading(false)
		}
	}

	return (
		<>
			<Head title="Receipts" />

			{/* Floating Section Start */}
			<div
				className={cn(fabPosition.className, "flex flex-col items-end gap-2")}
				style={fabPosition.style}>
				<input
					ref={cameraInput}
					type="file"
					accept="image/*"
					capture="environment"
					className="hidden"
					onChange={handleFile}
				/>
				<input
					ref={fileInput}
					type="file"
					accept={ACCEPTED_RECEIPT_TYPES}
					className="hidden"
					onChange={handleFile}
				/>

				<Button
					type="button"
					disabled={uploading}
					onClick={() => fileInput.current?.click()}
					aria-label="Upload photo or PDF"
					title="Upload photo or PDF"
					className="h-14 min-w-14 rounded-full px-4 shadow-lg sm:px-5"
					data-test="upload-receipt-button">
					<Upload className="size-5" />
					<span className="hidden sm:inline">Upload photo or PDF</span>
				</Button>
				<Button
					type="button"
					disabled={uploading}
					onClick={() => cameraInput.current?.click()}
					aria-label="Scan receipt"
					title="Scan receipt"
					className="h-14 min-w-14 rounded-full px-4 shadow-lg sm:px-6"
					data-test="scan-receipt-button">
					{uploading ? <Spinner /> : <Camera className="size-6" />}
					<span className="hidden sm:inline">Scan receipt</span>
				</Button>
			</div>
			{/* Floating Section End */}

			{/* Bottom padding keeps the last receipt clear of the floating buttons. */}
			<div className="flex flex-1 flex-col gap-6 pb-48 md:pb-28">
				<div className="relative overflow-hidden rounded-2xl border bg-card px-4 py-4 shadow-xs sm:px-5">
					<div className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/8 via-transparent to-transparent" />

					<div className="relative space-y-4">
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
