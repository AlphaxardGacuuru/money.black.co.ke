import type { ReceiptStatus } from "@/types/receipt"

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
