export type ReceiptStatus = "processing" | "review" | "confirmed" | "failed"

export type ReceiptProcessingStep = "queued" | "preparing" | "reading" | "sorting" | "retrying"

export type ReceiptItem = {
	id?: string
	description: string
	quantity: number | null
	amount: number
	categoryId: string | null
}

export type ReceiptTransaction = {
	id: string
	amount: number
	categoryId: string
	categoryName?: string | null
	notes?: string | null
}

export type Receipt = {
	id: string
	status: ReceiptStatus
	processingStep: ReceiptProcessingStep | null
	processingAttempt: number | null
	processingStepAt: string | null
	merchant: string | null
	receiptDate: string | null
	currency: string
	total: number | null
	tax: number | null
	discount: number | null
	accountId: string | null
	originalName: string | null
	mimeType: string
	isPdf: boolean
	failureReason: string | null
	confirmedAt: string | null
	createdAt: string
	itemsCount?: number
	items?: ReceiptItem[]
	transactions?: ReceiptTransaction[]
}
