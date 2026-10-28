import Axios from "@/lib/axios"
import { cacheReceipt } from "@/lib/receipt-queries"
import { store } from "@/routes/api/receipts"
import type { Receipt, ReceiptProcessingStep, ReceiptStatus } from "@/types/receipt"

export const ACCEPTED_RECEIPT_TYPES =
	"image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"

export const MAX_RECEIPT_BYTES = 10 * 1024 * 1024

const MAX_IMAGE_SIDE = 2000

export const receiptStatusLabels: Record<ReceiptStatus, string> = {
	processing: "Reading…",
	review: "Needs review",
	confirmed: "Added",
	failed: "Couldn't read",
}

/** Matches ProcessReceipt::$tries. */
export const MAX_SCAN_ATTEMPTS = 3

type ProcessingStepDetails = {
	step: Exclude<ReceiptProcessingStep, "retrying">
	label: string
	title: string
	description: string
	/** Seconds on this step before we reassure the user that it's still going. */
	slowAfterSeconds: number
	slowMessage: string
}

/** The scan steps in order, as reported by the ProcessReceipt job. */
export const receiptProcessingSteps: ProcessingStepDetails[] = [
	{
		step: "queued",
		label: "Waiting to start",
		title: "Waiting to start",
		description: "Your receipt is saved and next in line to be read.",
		slowAfterSeconds: 45,
		slowMessage: "It's busy right now. Your receipt is saved and will start on its own.",
	},
	{
		step: "preparing",
		label: "Preparing the file",
		title: "Preparing your receipt",
		description: "Loading the file and your categories.",
		slowAfterSeconds: 20,
		slowMessage: "Large files take a little longer to load.",
	},
	{
		step: "reading",
		label: "Reading with AI",
		title: "Reading your receipt",
		description: "Picking out the shop, date, items and totals. This usually takes 5 to 20 seconds.",
		slowAfterSeconds: 40,
		slowMessage: "Still reading. Long or blurry receipts take a little longer.",
	},
	{
		step: "sorting",
		label: "Sorting into categories",
		title: "Sorting the items",
		description: "Matching each item to one of your categories.",
		slowAfterSeconds: 20,
		slowMessage: "Almost there.",
	},
]

/**
 * Where a processing receipt is in the scan. A retry is shown on the reading
 * step, since that's the step that failed.
 */
export function receiptProgress(receipt: Receipt) {
	const isRetrying = receipt.processingStep === "retrying"
	const step = isRetrying ? "reading" : (receipt.processingStep ?? "queued")
	const index = Math.max(
		0,
		receiptProcessingSteps.findIndex((details) => details.step === step)
	)

	return {
		index,
		details: receiptProcessingSteps[index],
		isRetrying,
		attempt: receipt.processingAttempt ?? 1,
	}
}

/**
 * A rough percentage for the progress bar. Reading creeps forward over time
 * so the bar keeps moving while we wait on the AI.
 */
export function receiptProgressPercent(receipt: Receipt, secondsOnStep: number): number {
	const { details, isRetrying } = receiptProgress(receipt)

	switch (details.step) {
		case "queued":
			return 10
		case "preparing":
			return 25
		case "reading":
			return isRetrying ? 30 : Math.min(85, 30 + secondsOnStep * 3)
		case "sorting":
			return 92
	}
}

export function secondsSince(timestamp: string | null, now: number): number {
	if (!timestamp) {
		return 0
	}

	// Clamp, since the server and device clocks can disagree slightly.
	return Math.max(0, Math.floor((now - Date.parse(timestamp)) / 1000))
}

export function formatAmount(amount: number | null | undefined, currency = "KES") {
	return `${currency} ${(amount ?? 0).toLocaleString("en-KE")}`
}

/**
 * Shrink large photos before upload to save mobile data. Falls back to the
 * original file when the browser can't decode it (e.g. HEIC outside Safari).
 */
export async function prepareReceiptFile(file: File): Promise<File> {
	const isResizableImage = ["image/jpeg", "image/png", "image/webp"].includes(file.type)

	if (!isResizableImage || file.size < 1.5 * 1024 * 1024) {
		return file
	}

	try {
		const bitmap = await createImageBitmap(file)
		const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height))

		if (scale === 1) {
			bitmap.close()

			return file
		}

		const canvas = document.createElement("canvas")
		canvas.width = Math.round(bitmap.width * scale)
		canvas.height = Math.round(bitmap.height * scale)
		canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
		bitmap.close()

		const blob = await new Promise<Blob | null>((resolve) =>
			canvas.toBlob(resolve, "image/jpeg", 0.85)
		)

		if (!blob || blob.size >= file.size) {
			return file
		}

		return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", {
			type: "image/jpeg",
		})
	} catch {
		return file
	}
}

/**
 * Split the receipt total across categories in proportion to their item
 * subtotals. Mirrors ReceiptService::allocateTotal so the preview matches.
 */
export function allocateTotal(
	subtotals: Record<string, number>,
	total: number
): Record<string, number> {
	const itemsTotal = Object.values(subtotals).reduce((sum, value) => sum + value, 0)

	if (itemsTotal <= 0 || itemsTotal === total) {
		return { ...subtotals }
	}

	const allocated: Record<string, number> = {}
	const remainders: [string, number][] = []

	for (const [categoryId, subtotal] of Object.entries(subtotals)) {
		const exact = (subtotal * total) / itemsTotal
		allocated[categoryId] = Math.floor(exact)
		remainders.push([categoryId, exact - Math.floor(exact)])
	}

	remainders.sort((a, b) => b[1] - a[1])

	let assigned = Object.values(allocated).reduce((sum, value) => sum + value, 0)

	for (const [categoryId] of remainders) {
		if (assigned >= total) {
			break
		}

		allocated[categoryId] += 1
		assigned += 1
	}

	return allocated
}

/**
 * Shrink (if needed) and upload a receipt file. Throws on failure; use
 * receiptUploadErrorMessage() to turn the error into something readable.
 */
export async function uploadReceiptFile(selected: File): Promise<{ receipt: Receipt; message: string }> {
	const file = await prepareReceiptFile(selected)

	if (file.size > MAX_RECEIPT_BYTES) {
		throw new Error("The file must be 10 MB or smaller.")
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

	// Lets the receipt page show it straight away, without another request.
	cacheReceipt(response.data.data)

	return { receipt: response.data.data, message: response.data.message }
}

export function receiptUploadErrorMessage(error: unknown): string {
	const e = error as {
		message?: string
		response?: {
			status?: number
			data?: { message?: string; errors?: Record<string, string[]> }
		}
	}

	if (!e.response) {
		return e.message ?? "Upload failed. Please try again."
	}

	if (e.response.status === 429) {
		return "Too many uploads. Please wait a minute."
	}

	return e.response.data?.errors?.file?.[0] ?? e.response.data?.message ?? "Upload failed. Please try again."
}
