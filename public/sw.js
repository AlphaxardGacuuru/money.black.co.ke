const CACHE_NAME = "money-black-v2-mvv8uzqf"
// Files shared to the app (Web Share Target) wait here until the Receipts page uploads them.
// Kept out of the versioned cache so a new deploy doesn't discard them.
const SHARED_RECEIPTS_CACHE = "shared-receipts"
const SHARE_TARGET_PATH = "/receipts/share"
const ASSETS_TO_CACHE = [
	"/",
	"/manifest.webmanifest",
	"/favicon.ico",
	"/favicon.svg",
	"/favicon-16x16.png",
	"/favicon-32x32.png",
	"/apple-touch-icon.png",
	"/android-chrome-192x192.png",
	"/android-chrome-512x512.png",
]

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
	)

	self.skipWaiting()
})

self.addEventListener("message", (event) => {
	if (event.data?.type === "SKIP_WAITING") {
		self.skipWaiting()
	}
})

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys
						.filter((key) => key !== CACHE_NAME && key !== SHARED_RECEIPTS_CACHE)
						.map((key) => caches.delete(key))
				)
			)
	)

	self.clients.claim()
})

self.addEventListener("fetch", (event) => {
	const url = new URL(event.request.url)

	if (
		event.request.method === "POST" &&
		url.origin === self.location.origin &&
		url.pathname === SHARE_TARGET_PATH
	) {
		event.respondWith(storeSharedReceipts(event.request))

		return
	}

	if (event.request.method !== "GET") {
		return
	}

	const isApiRequest =
		url.origin === self.location.origin && url.pathname.startsWith("/api/")
	const isXhrRequest =
		event.request.headers.get("X-Requested-With") === "XMLHttpRequest"
	const isStaticAssetRequest =
		url.origin === self.location.origin &&
		(ASSETS_TO_CACHE.includes(url.pathname) ||
			url.pathname.startsWith("/build/"))

	// Dynamic API requests and XHR requests should always hit the network.
	if (isApiRequest || isXhrRequest) {
		event.respondWith(fetch(event.request))

		return
	}

	if (event.request.mode === "navigate") {
		event.respondWith(fetch(event.request).catch(() => caches.match("/")))

		return
	}

	// Non-static assets use network-first to avoid stale UI/data.
	if (!isStaticAssetRequest) {
		event.respondWith(
			fetch(event.request).catch(() => caches.match(event.request))
		)

		return
	}

	event.respondWith(
		caches.match(event.request).then((cachedResponse) => {
			if (cachedResponse) {
				return cachedResponse
			}

			return fetch(event.request)
				.then((networkResponse) => {
					if (
						!networkResponse ||
						networkResponse.status !== 200 ||
						networkResponse.type !== "basic"
					) {
						return networkResponse
					}

					const responseToCache = networkResponse.clone()

					caches.open(CACHE_NAME).then((cache) => {
						cache.put(event.request, responseToCache)
					})

					return networkResponse
				})
				.catch(() => cachedResponse)
		})
	)
})


// ─── Share target ─────────────────────────────────────────────────────────────

/**
 * Receive files shared from another app (e.g. a receipt PDF from an email),
 * hold them in Cache Storage, and hand off to the Receipts page, which uploads
 * them with the user's API token (the service worker has no access to it).
 */
async function storeSharedReceipts(request) {
	try {
		const formData = await request.formData()
		const files = formData
			.getAll("receipt")
			.filter((file) => file instanceof File && file.size > 0)

		if (files.length === 0) {
			return Response.redirect("/receipts?share=empty", 303)
		}

		const cache = await caches.open(SHARED_RECEIPTS_CACHE)
		const batch = Date.now()

		await Promise.all(
			files.map((file, index) =>
				cache.put(
					`/shared-receipts/${batch}-${index}`,
					new Response(file, {
						headers: {
							"Content-Type": file.type || "application/octet-stream",
							"X-File-Name": encodeURIComponent(file.name || "shared-receipt"),
						},
					})
				)
			)
		)

		return Response.redirect("/receipts?shared=1", 303)
	} catch {
		return Response.redirect("/receipts?share=failed", 303)
	}
}

// ─── Web push notifications ───────────────────────────────────────────────────

self.addEventListener("push", (event) => {
	if (!event.data) {
		return
	}

	const payload = event.data.json()

	const options = {
		body: payload.body,
		icon: payload.icon ?? "/notification-badge-192x192.png",
		badge: payload.badge ?? "/notification-badge-192x192.png",
		tag: payload.tag,
		renotify: payload.renotify,
		data: payload.data,
	}

	event.waitUntil(
		self.registration.showNotification(payload.title ?? "New notification", options)
	)
})

// Opens the notification's target URL, or focuses it if already open in
// some tab, so a click never opens a duplicate window for the same page.
function openNotificationTarget(url) {
	return self.clients
		.matchAll({ type: "window", includeUncontrolled: true })
		.then((clients) => {
			const targetPath = new URL(url, self.location.origin).pathname
			const existing = clients.find(
				(client) => new URL(client.url).pathname === targetPath
			)

			if (existing) {
				return existing.focus()
			}

			return self.clients.openWindow(new URL(url, self.location.origin).href)
		})
}

self.addEventListener("notificationclick", (event) => {
	event.notification.close()

	const data = event.notification.data

	if (!data?.url) {
		return
	}

	event.waitUntil(openNotificationTarget(data.url))
})
