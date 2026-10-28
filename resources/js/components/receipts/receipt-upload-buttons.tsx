import { useNavigate } from "@tanstack/react-router"
import { Camera, Upload } from "lucide-react"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"
import { Spinner } from "@/components/ui/spinner"
import {
	ACCEPTED_RECEIPT_TYPES,
	receiptUploadErrorMessage,
	uploadReceiptFile,
} from "@/lib/receipts"
import { toast } from "@/lib/toast"
import type { Receipt } from "@/types/receipt"

type Props = {
	onUploaded?: (receipt: Receipt) => void
}

export default function ReceiptUploadButtons({ onUploaded }: Props) {
	const navigate = useNavigate()
	const cameraInput = useRef<HTMLInputElement>(null)
	const fileInput = useRef<HTMLInputElement>(null)
	const [uploading, setUploading] = useState(false)
	const { state: sidebarState } = useSidebar()

	// Keep clear of the right-hand sidebar on desktop, as the transactions page's buttons do.
	const desktopFabOffset =
		sidebarState === "collapsed"
			? "calc(var(--sidebar-width-icon) + 2rem)"
			: "calc(var(--sidebar-width) + 2rem)"

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
			onUploaded?.(receipt)
			navigate({ to: `/receipts/${receipt.id}` })
		} catch (error: unknown) {
			toast.error(receiptUploadErrorMessage(error))
		} finally {
			setUploading(false)
		}
	}

	return (
		<div
			className="fixed right-4 bottom-26 z-30 flex flex-col items-end gap-2 md:right-(--fab-right-offset) md:bottom-6"
			style={{ "--fab-right-offset": desktopFabOffset } as React.CSSProperties}>
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
				variant="outline"
				disabled={uploading}
				onClick={() => fileInput.current?.click()}
				aria-label="Upload photo or PDF"
				title="Upload photo or PDF"
				className="h-14 min-w-14 rounded-full bg-background px-4 shadow-lg sm:px-5"
				data-test="upload-receipt-button">
				<Upload className="size-5" />
				<span className="hidden sm:inline">Upload photo or PDF</span>
			</Button>
			<Button
				type="button"
				variant="secondary"
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
	)
}
