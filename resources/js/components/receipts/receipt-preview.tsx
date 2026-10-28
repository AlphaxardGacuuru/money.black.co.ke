import { ExternalLink, FileText } from "lucide-react"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import Axios from "@/lib/axios"
import { cn } from "@/lib/utils"
import { file } from "@/routes/api/receipts"
import type { Receipt } from "@/types/receipt"

/**
 * Loads the receipt through the authenticated API (an <img> tag can't send the
 * bearer token) and shows it from a temporary object URL. While `scanning`,
 * a scan line sweeps over the image.
 */
export default function ReceiptPreview({ receipt, scanning = false }: { receipt: Receipt; scanning?: boolean }) {
	const [objectUrl, setObjectUrl] = useState<string | null>(null)
	const [failed, setFailed] = useState(false)

	useEffect(() => {
		let url: string | null = null

		Axios.get<Blob>(file(receipt.id).url, { responseType: "blob" })
			.then((response) => {
				url = URL.createObjectURL(response.data)
				setObjectUrl(url)
			})
			.catch(() => setFailed(true))

		return () => {
			if (url) {
				URL.revokeObjectURL(url)
			}
		}
	}, [receipt.id])

	if (failed) {
		return <p className="text-sm text-muted-foreground">Couldn't load the receipt file.</p>
	}

	if (!objectUrl) {
		return <Skeleton className="h-72 w-full rounded-lg" />
	}

	if (receipt.isPdf) {
		return (
			<a
				href={objectUrl}
				target="_blank"
				rel="noreferrer"
				className="flex items-center gap-2 text-sm font-medium underline underline-offset-4">
				<FileText className="size-4" />
				{receipt.originalName ?? "Open PDF"}
				<ExternalLink className="size-3" />
			</a>
		)
	}

	return (
		<a
			href={objectUrl}
			target="_blank"
			rel="noreferrer"
			className="relative block overflow-hidden rounded-lg">
			<img
				src={objectUrl}
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
