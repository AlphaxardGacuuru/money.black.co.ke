import { useNavigate } from "@tanstack/react-router"
import { Fingerprint, LogOut } from "lucide-react"
import { useState } from "react"
import AppLogoIcon from "@/components/app-logo-icon"
import InputError from "@/components/input-error"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useApp } from "@/contexts/AppContext"
import axios from "@/lib/axios"
import {
	getPasskey,
	isPasskeyCancellation,
	type RequestOptionsJSON,
} from "@/lib/passkeys"
import { clearAuth } from "@/middleware/auth"
import { logout } from "@/routes"
import {
	options as unlockOptions,
	store as unlockWithPasskey,
} from "@/routes/passkey/confirmation"

/**
 * Covers the app once the server reports this device as locked (opt-in, after a day idle).
 * The biometric prompt needs a tap to start, so it can't open on its own when the app comes back.
 */
export default function AppLockScreen() {
	const { auth } = useApp()
	const navigate = useNavigate()
	const [processing, setProcessing] = useState(false)
	const [error, setError] = useState<string>()

	async function handleUnlock() {
		setProcessing(true)
		setError(undefined)

		try {
			const { data } = await axios.get<{ options: RequestOptionsJSON }>(
				unlockOptions().url
			)
			const credential = await getPasskey(data.options)
			const { url, method } = unlockWithPasskey()
			await axios.request({ url, method, data: { credential } })

			// Requests made while locked failed, so reload rather than chase every stale screen.
			window.location.reload()
		} catch (err: unknown) {
			if (!isPasskeyCancellation(err)) {
				setError("That didn't work. Try again, or sign out and sign back in.")
			}

			setProcessing(false)
		}
	}

	function handleSignOut() {
		setProcessing(true)
		const { url, method } = logout()

		axios
			.request({ url, method })
			.catch(() => {})
			.finally(() => {
				clearAuth()
				setProcessing(false)
				navigate({ to: "/login" })
			})
	}

	if (!auth?.app_locked) {
		return null
	}

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby="app-lock-title"
			className="fixed inset-0 z-[100] flex items-center justify-center bg-background px-4">
			<div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
				<AppLogoIcon className="size-12 dark:invert" />
				<div className="space-y-2">
					<h1
						id="app-lock-title"
						className="text-xl font-semibold">
						Black Money is locked
					</h1>
					<p className="text-sm text-muted-foreground">
						Welcome back{auth.name ? `, ${auth.name.split(" ")[0]}` : ""}. Use
						biometrics to unlock.
					</p>
				</div>

				<div className="flex w-full flex-col gap-3">
					<Button
						type="button"
						className="w-full"
						disabled={processing}
						onClick={handleUnlock}>
						{processing ? <Spinner /> : <Fingerprint />}
						Unlock with biometrics
					</Button>
					<Button
						type="button"
						variant="transparent"
						className="w-full"
						disabled={processing}
						onClick={handleSignOut}>
						<LogOut />
						Sign out
					</Button>
					<InputError
						message={error}
						className="text-center"
					/>
				</div>
			</div>
		</div>
	)
}
