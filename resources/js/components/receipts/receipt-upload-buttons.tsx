import { useNavigate } from "@tanstack/react-router"
import { Camera, Upload } from "lucide-react"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
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
		<div className="flex flex-wrap gap-3">
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
				onClick={() => cameraInput.current?.click()}
				data-test="scan-receipt-button">
				{uploading ? <Spinner /> : <Camera />}
				Scan receipt
			</Button>
			<Button
				type="button"
				variant="outline"
				disabled={uploading}
				onClick={() => fileInput.current?.click()}
				data-test="upload-receipt-button">
				<Upload />
				Upload photo or PDF
			</Button>
		</div>
	)
}
