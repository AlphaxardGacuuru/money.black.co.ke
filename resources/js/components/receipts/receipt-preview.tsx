import { ExternalLink, FileText } from "lucide-react"
import { useEffect, useState } from "react"
import { Spinner } from "@/components/ui/spinner"
import Axios from "@/lib/axios"
import { file } from "@/routes/api/receipts"
import type { Receipt } from "@/types/receipt"

/**
 * Loads the receipt through the authenticated API (an <img> tag can't send the
 * bearer token) and shows it from a temporary object URL.
 */
export default function ReceiptPreview({ receipt }: { receipt: Receipt }) {
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
		return (
			<div className="flex h-48 items-center justify-center">
				<Spinner />
			</div>
		)
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
			rel="noreferrer">
			<img
				src={objectUrl}
				alt="Receipt"
				className="max-h-[70vh] w-full rounded-lg border object-contain"
			/>
		</a>
	)
}
