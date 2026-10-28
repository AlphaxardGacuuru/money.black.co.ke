import { useQuery } from "@tanstack/react-query"
import { ExternalLink, FileText } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { receiptFileQuery } from "@/lib/receipt-queries"
import { cn } from "@/lib/utils"

/**
 * Shows the receipt file. It only needs the ID, so the download starts as soon
 * as the page opens, and it's cached for the rest of the session. While
 * `scanning`, a scan line sweeps over the image.
 */
export default function ReceiptPreview({
	receiptId,
	originalName,
	scanning = false,
}: {
	receiptId: string
	originalName?: string | null
	scanning?: boolean
}) {
	const { data: receiptFile, isError } = useQuery(receiptFileQuery(receiptId))

	if (isError) {
		return <p className="text-sm text-muted-foreground">Couldn't load the receipt file.</p>
	}

	if (!receiptFile) {
		return <Skeleton className="h-72 w-full rounded-lg" />
	}

	if (receiptFile.isPdf) {
		return (
			<a
				href={receiptFile.url}
				target="_blank"
				rel="noreferrer"
				className="flex items-center gap-2 text-sm font-medium underline underline-offset-4">
				<FileText className="size-4" />
				{originalName ?? "Open PDF"}
				<ExternalLink className="size-3" />
			</a>
		)
	}

	return (
		<a
			href={receiptFile.url}
			target="_blank"
			rel="noreferrer"
			className="relative block overflow-hidden rounded-lg">
			<img
				src={receiptFile.url}
				alt="Receipt"
				className={cn(
					"max-h-[70vh] w-full rounded-lg border object-contain transition-[filter] duration-500",
					scanning && "brightness-95 saturate-50"
				)}
			/>
			{scanning && (
				<div
					aria-hidden
					className="pointer-events-none absolute inset-x-0 h-16 bg-linear-to-b from-transparent via-primary/20 to-primary/40 motion-safe:animate-receipt-scan motion-reduce:hidden">
					<div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary shadow-[0_0_12px_2px] shadow-primary/60" />
				</div>
			)}
		</a>
	)
}
