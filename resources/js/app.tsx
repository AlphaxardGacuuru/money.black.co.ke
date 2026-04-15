import { createInertiaApp } from "@inertiajs/react"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { initializeTheme } from "@/hooks/use-appearance"
import AppLayout from "@/layouts/app-layout"
import AuthLayout from "@/layouts/auth-layout"
import SettingsLayout from "@/layouts/settings/layout"
import { AppProvider } from "@/contexts/AppContext"

const appName = import.meta.env.VITE_APP_NAME || "Laravel"

createInertiaApp({
	title: (title) => (title ? `${title} - ${appName}` : appName),
	layout: (name) => {
		switch (true) {
			case name === "welcome":
				return null
			case name.startsWith("auth/"):
				return AuthLayout
			case name.startsWith("settings/"):
				return [AppLayout, SettingsLayout]
			default:
				return AppLayout
		}
	},
	strictMode: true,
	withApp(app) {
		return (
			<AppProvider>
				<TooltipProvider delayDuration={0}>
					{app}
					<Toaster />
				</TooltipProvider>
			</AppProvider>
		)
	},
	progress: {
		color: "#4B5563",
	},
})

if ("serviceWorker" in navigator) {
	window.addEventListener("load", () => {
		navigator.serviceWorker.register("/sw.js").catch(() => {
			// Ignore registration failures and keep the web app functional.
		})
	})
}

// This will set light / dark mode on load...
initializeTheme()
