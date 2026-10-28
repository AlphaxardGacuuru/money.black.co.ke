import { useEffect, useState } from "react"

/**
 * The current time, refreshed every `intervalMs` while `enabled`. Use it for
 * live elapsed-time labels.
 */
export function useNow(intervalMs = 1000, enabled = true): number {
	const [now, setNow] = useState(() => Date.now())

	useEffect(() => {
		if (!enabled) {
			return
		}

		const timer = window.setInterval(() => setNow(Date.now()), intervalMs)

		return () => window.clearInterval(timer)
	}, [intervalMs, enabled])

	return now
}
