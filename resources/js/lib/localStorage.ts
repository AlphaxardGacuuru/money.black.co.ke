export function readJsonFromLocalStorage<T>(key: string, fallback: T): T {
	if (typeof window === "undefined") {
		return fallback
	}

	try {
		const value = window.localStorage.getItem(key)

		if (!value) {
			return fallback
		}

		return JSON.parse(value) as T
	} catch {
		return fallback
	}
}

export function readStringFromLocalStorage(key: string): string | null {
	if (typeof window === "undefined") {
		return null
	}

	return window.localStorage.getItem(key)
}

export function setLocalStorage(key: string, value: unknown): void {
	if (typeof window === "undefined") {
		return
	}

	window.localStorage.setItem(key, JSON.stringify(value))
}
