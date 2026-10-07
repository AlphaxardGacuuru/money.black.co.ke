import { useSyncExternalStore } from "react"

// Coordinates the order of the app's onboarding dialogs so they never stack:
// the PWA install prompt always gets first shot, and the notifications
// prompt waits until that step is resolved (shown-and-closed, or determined
// not applicable) before it's allowed to open.
let pwaInstallStepResolved = false
const listeners = new Set<() => void>()

export function markPwaInstallStepResolved(): void {
	if (pwaInstallStepResolved) {
		return
	}
	pwaInstallStepResolved = true
	listeners.forEach((listener) => listener())
}

function subscribe(callback: () => void): () => void {
	listeners.add(callback)
	return () => listeners.delete(callback)
}

function getSnapshot(): boolean {
	return pwaInstallStepResolved
}

function getServerSnapshot(): boolean {
	return false
}

export function usePwaInstallStepResolved(): boolean {
	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
