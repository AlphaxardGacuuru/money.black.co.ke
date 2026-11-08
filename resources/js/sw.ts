/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching"
import { registerRoute } from "workbox-routing"
import { CacheFirst, NetworkFirst } from "workbox-strategies"
import { ExpirationPlugin } from "workbox-expiration"

declare const self: ServiceWorkerGlobalScope

// Files shared to the app (Web Share Target) wait here until the Receipts page
// uploads them. Kept out of Workbox's versioned caches so a new deploy doesn't
// discard them.
const SHARED_RECEIPTS_CACHE = "shared-receipts"
const SHARE_TARGET_PATH = "/receipts/share"

// ─── Precache Vite build assets ───────────────────────────────────────────────
// The build manifest is injected here by vite-plugin-pwa at build time.
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// Wait for the "Refresh" click on the new version toast in app.tsx instead of
// activating immediately, so a deploy doesn't disrupt an open session.
self.addEventListener("message", (event) => {
	if (event.data?.type === "SKIP_WAITING") {
		self.skipWaiting()
	}
})

// Drops the caches of the hand-written service worker this one replaced
// ("money-black-v2-<build id>"), and cached pages, which link the previous
// build's assets that this version's precache no longer holds.
self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys
						.filter((key) => key.startsWith("money-black-") || key === "navigation")
						.map((key) => caches.delete(key))
				)
			)
			.then(() => self.clients.claim())
	)
})

// ─── Share target ─────────────────────────────────────────────────────────────

/**
 * Receive files shared from another app (e.g. a receipt PDF from an email),
 * hold them in Cache Storage, and hand off to the Receipts page, which uploads
 * them with the user's API token (the service worker has no access to it).
 */
async function storeSharedReceipts(request: Request) {
	try {
		const formData = await request.formData()
		const files = formData
			.getAll("receipt")
			.filter((file): file is File => file instanceof File && file.size > 0)

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

registerRoute(
	({ url }) =>
		url.origin === self.location.origin && url.pathname === SHARE_TARGET_PATH,
	({ request }) => storeSharedReceipts(request),
	"POST"
)

// ─── Caching strategies ───────────────────────────────────────────────────────
// API and XHR requests match no route, so they always go to the network.

// Favicons and PWA icons: cache-first, valid for 30 days.
registerRoute(
	({ url }) =>
		url.origin === self.location.origin &&
		/\.(png|ico|svg)$/.test(url.pathname),
	new CacheFirst({
		cacheName: "static-icons",
		plugins: [
			new ExpirationPlugin({
				maxEntries: 20,
				maxAgeSeconds: 30 * 24 * 60 * 60,
			}),
		],
	})
)

// Web app manifest: network-first, so a rename or new icon shows up on the
// next visit.
registerRoute(
	({ url }) =>
		url.origin === self.location.origin &&
		url.pathname.endsWith(".webmanifest"),
	new NetworkFirst({ cacheName: "webmanifest" })
)

// ─── SPA navigation fallback ──────────────────────────────────────────────────
// Every page is the app shell, routed on the client by TanStack Router. Kept
// for a month so the app still opens while offline. After the phone has been
// idle the first request often stalls instead of failing, which left a blank
// screen until a reload, so the cached page is used whenever the network
// hasn't answered within 3 seconds.
registerRoute(
	({ request }) => request.mode === "navigate",
	new NetworkFirst({
		cacheName: "navigation",
		networkTimeoutSeconds: 3,
		plugins: [
			new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 30 * 24 * 60 * 60 }),
		],
	})
)

// ─── Web push notifications ───────────────────────────────────────────────────

type PushPayload = {
	title?: string
	body?: string
	icon?: string
	badge?: string
	tag?: string
	renotify?: boolean
	data?: { url?: string }
}

self.addEventListener("push", (event) => {
	if (!event.data) {
		return
	}

	const payload: PushPayload = event.data.json()

	// `renotify` is a real, supported NotificationOptions field missing from
	// TypeScript's bundled DOM lib.
	const options: NotificationOptions & { renotify?: boolean } = {
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
function openNotificationTarget(url: string) {
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

	const data = event.notification.data as { url?: string } | undefined

	if (!data?.url) {
		return
	}

	event.waitUntil(openNotificationTarget(data.url))
})
