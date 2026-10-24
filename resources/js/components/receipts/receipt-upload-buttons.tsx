import { useNavigate } from "@tanstack/react-router"
import { Camera, Upload } from "lucide-react"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import Axios from "@/lib/axios"
import {
	ACCEPTED_RECEIPT_TYPES,
	MAX_RECEIPT_BYTES,
	prepareReceiptFile,
} from "@/lib/receipts"
import { toast } from "@/lib/toast"
import { store } from "@/routes/api/receipts"
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
			const file = await prepareReceiptFile(selected)

			if (file.size > MAX_RECEIPT_BYTES) {
				toast.error("The file must be 10 MB or smaller.")

				return
			}

			const formData = new FormData()
			formData.append("file", file)

			const { url, method } = store()
			const response = await Axios.request<{ data: Receipt; message: string }>({
				url,
				method,
				data: formData,
				headers: { "Content-Type": "multipart/form-data" },
			})

			toast.success(response.data.message)
			onUploaded?.(response.data.data)
			navigate({ to: `/receipts/${response.data.data.id}` })
		} catch (error: unknown) {
			const e = error as {
				response?: {
					status?: number
					data?: { message?: string; errors?: Record<string, string[]> }
				}
			}

			toast.error(
				e.response?.status === 429
					? "Too many uploads. Please wait a minute."
					: (e.response?.data?.errors?.file?.[0] ??
							e.response?.data?.message ??
							"Upload failed. Please try again.")
			)
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
