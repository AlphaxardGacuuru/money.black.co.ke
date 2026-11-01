import { useState } from "react"
import Heading from "@/components/heading"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useApp } from "@/contexts/AppContext"
import axios from "@/lib/axios"
import { toast } from "@/lib/toast"
import { invalidateAuth } from "@/middleware/auth"
import { update } from "@/routes/api/app-lock"

export default function AppLockSetting() {
	const { auth } = useApp()
	const [processing, setProcessing] = useState(false)
	const enabled = auth?.app_lock_enabled ?? false

	function handleChange(checked: boolean) {
		setProcessing(true)
		const { url, method } = update()

		axios
			.request<{ message: string }>({ url, method, data: { enabled: checked } })
			.then(({ data }) => {
				toast.success(data.message)
				invalidateAuth()
			})
			.catch((err: unknown) => {
				const e = err as {
					response?: { data?: { errors?: Record<string, string[]> } }
				}

				toast.error(
					e.response?.data?.errors?.enabled?.[0] ??
						"Couldn't update the app lock."
				)
			})
			.finally(() => setProcessing(false))
	}

	return (
		<div className="space-y-6">
			<Heading
				variant="small"
				title="App lock"
				description="Ask for biometrics when you come back after a day away"
			/>

			<div className="flex items-center justify-between gap-4">
				<div className="space-y-1">
					<Label htmlFor="app-lock">Lock after a day away</Label>
					<p className="text-sm text-muted-foreground">
						Needs a passkey. On a device without one, sign out and sign back in
						to get in.
					</p>
				</div>
				<Switch
					id="app-lock"
					checked={enabled}
					disabled={processing}
					onCheckedChange={handleChange}
				/>
			</div>
		</div>
	)
}
