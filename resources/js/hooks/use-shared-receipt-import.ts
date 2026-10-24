import { useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { receiptUploadErrorMessage, uploadReceiptFile } from "@/lib/receipts"
import { toast } from "@/lib/toast"

/** Must match SHARED_RECEIPTS_CACHE in public/sw.js. */
const SHARED_RECEIPTS_CACHE = "shared-receipts"

const shareProblems: Record<string, string> = {
	empty: "Nothing to upload. Share the receipt's PDF or a photo/screenshot of it.",
	failed: "We couldn't receive that file. Try uploading it with the button below.",
	unavailable: "Sharing isn't ready on this device yet. Upload the file with the button below.",
}

/** Guards against React's development double-invoked effects starting two imports. */
let importInProgress = false

/**
 * Uploads receipts that were shared to the installed app from another app.
 * The service worker stores them in Cache Storage; this picks them up once the
 * user is signed in and on the Receipts page.
 */
export function useSharedReceiptImport(onImported: () => void) {
	const navigate = useNavigate()
	const [importing, setImporting] = useState(false)

	useEffect(() => {
		const params = new URLSearchParams(window.location.search)
		const problem = params.get("share")

		if (problem || params.has("shared")) {
			window.history.replaceState(null, "", window.location.pathname)
		}

		if (problem && shareProblems[problem]) {
			toast.error(shareProblems[problem])
		}

		if (importInProgress || !("caches" in window)) {
			return
		}

		importInProgress = true

		async function importSharedReceipts() {
			const cache = await caches.open(SHARED_RECEIPTS_CACHE)
			const requests = await cache.keys()

			if (requests.length === 0) {
				return
			}

			setImporting(true)

			const uploadedIds: string[] = []

			for (const request of requests) {
				const response = await cache.match(request)

				if (!response) {
					continue
				}

				const blob = await response.blob()
				const name = decodeURIComponent(response.headers.get("X-File-Name") ?? "shared-receipt")
				const file = new File([blob], name, { type: blob.type || response.headers.get("Content-Type") || "" })

				try {
					const { receipt } = await uploadReceiptFile(file)
					uploadedIds.push(receipt.id)
				} catch (error: unknown) {
					toast.error(`${name}: ${receiptUploadErrorMessage(error)}`)
				} finally {
					await cache.delete(request)
				}
			}

			if (uploadedIds.length === 1) {
				toast.success("Receipt received. Reading it now…")
				navigate({ to: `/receipts/${uploadedIds[0]}` })

				return
			}

			if (uploadedIds.length > 1) {
				toast.success(`${uploadedIds.length} receipts received. Reading them now…`)
				onImported()
			}
		}

		importSharedReceipts()
			.catch(() => toast.error("We couldn't read the shared file. Try uploading it instead."))
			.finally(() => {
				importInProgress = false
				setImporting(false)
			})
	}, [navigate, onImported])

	return { importing }
}
