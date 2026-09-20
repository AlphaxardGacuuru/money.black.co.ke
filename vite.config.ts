import { wayfinder } from "@laravel/vite-plugin-wayfinder"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import laravel from "laravel-vite-plugin"
import { defineConfig, loadEnv, type Plugin } from "vite"
import fs from "fs"
import path from "path"

// Stamps public/sw.js with a fresh build id on every production build so its
// byte content always changes on deploy. That's what lets the browser's
// native service-worker update check detect a new version and hand it to
// workbox-window as a "waiting" worker, which the app surfaces as a toast.
function stampServiceWorkerVersion(): Plugin {
	return {
		name: "stamp-service-worker-version",
		apply: "build",
		closeBundle() {
			const swPath = path.resolve(__dirname, "public/sw.js")
			const contents = fs.readFileSync(swPath, "utf8")
			const match = contents.match(/const CACHE_NAME = "([^"]+)"/)

			if (!match) {
				return
			}

			const base = match[1].replace(/-[0-9a-z]{6,}$/, "")
			const buildId = Date.now().toString(36)
			const updated = contents.replace(
				match[0],
				`const CACHE_NAME = "${base}-${buildId}"`
			)

			fs.writeFileSync(swPath, updated)
		},
	}
}

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "")
	const vitePort = env.VITE_PORT ? Number.parseInt(env.VITE_PORT, 10) : 5173

	return {
		plugins: [
			laravel({
				input: ["resources/css/app.css", "resources/js/app.tsx"],
				refresh: true,
			}),
			react({
				babel: {
					plugins: ["babel-plugin-react-compiler"],
				},
			}),
			tailwindcss(),
			wayfinder({
				formVariants: true,
			}),
			stampServiceWorkerVersion(),
		],
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "resources/js"),
			},
		},
		server: {
			host: "0.0.0.0",
			port: vitePort,
			hmr: {
				host: "localhost",
				clientPort: vitePort,
			},
		},
	}
})
