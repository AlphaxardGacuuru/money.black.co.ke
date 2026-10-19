import { formatDistanceToNow } from "date-fns"
import { Fingerprint, Trash2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import Heading from "@/components/heading"
import InputError from "@/components/input-error"
import PasskeyConfirmationDialog from "@/components/passkey-confirmation-dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import axios from "@/lib/axios"
import {
	createPasskey,
	defaultPasskeyName,
	isPasskeyCancellation,
	passkeysSupported,
	type CreationOptionsJSON,
} from "@/lib/passkeys"
import { toast } from "@/lib/toast"
import { destroy, index, registrationOptions, store } from "@/routes/passkey"

type Passkey = {
	id: number
	name: string
	authenticator: string | null
	last_used_at: string | null
	created_at: string | null
}

type PendingAction = { kind: "register" } | { kind: "delete"; passkey: Passkey }

function requiresConfirmation(err: unknown): boolean {
	return (err as { response?: { status?: number } }).response?.status === 423
}

export default function PasskeysManager() {
	const supported = passkeysSupported()
	const [passkeys, setPasskeys] = useState<Passkey[]>([])
	const [loading, setLoading] = useState(true)
	const [registering, setRegistering] = useState(false)
	const [deletingId, setDeletingId] = useState<number | null>(null)
	const [error, setError] = useState<string>()
	const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)

	const fetchPasskeys = useCallback(async () => {
		try {
			const { data } = await axios.get<{ data: Passkey[] }>(index().url)
			setPasskeys(data.data)
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchPasskeys()
	}, [fetchPasskeys])

	async function handleRegister() {
		setRegistering(true)
		setError(undefined)

		try {
			const { data } = await axios.get<{ options: CreationOptionsJSON }>(
				registrationOptions().url
			)

			const credential = await createPasskey(data.options)

			const { url, method } = store()
			const response = await axios.request<{ message: string; data: Passkey }>({
				url,
				method,
				data: { name: defaultPasskeyName(), credential },
			})

			setPasskeys((current) => [response.data.data, ...current])
			toast.success(response.data.message)
		} catch (err: unknown) {
			if (isPasskeyCancellation(err)) {
				return
			}

			if (requiresConfirmation(err)) {
				setPendingAction({ kind: "register" })
				return
			}

			const e = err as {
				response?: { data?: { errors?: Record<string, string[]> } }
			}
			const message =
				e.response?.data?.errors?.credential?.[0] ??
				"Could not set up biometric login on this device."

			setError(message)
			toast.error(message)
		} finally {
			setRegistering(false)
		}
	}

	async function handleDelete(passkey: Passkey) {
		setDeletingId(passkey.id)

		try {
			const { url, method } = destroy(passkey.id)
			await axios.request({ url, method })
			setPasskeys((current) => current.filter((p) => p.id !== passkey.id))
			toast.success("Passkey removed.")
		} catch (err: unknown) {
			if (requiresConfirmation(err)) {
				setPendingAction({ kind: "delete", passkey })
				return
			}

			toast.error("Could not remove the passkey.")
		} finally {
			setDeletingId(null)
		}
	}

	function handleConfirmed() {
		const action = pendingAction
		setPendingAction(null)

		if (action?.kind === "register") {
			handleRegister()
		} else if (action?.kind === "delete") {
			handleDelete(action.passkey)
		}
	}

	return (
		<div className="space-y-6">
			<Heading
				variant="small"
				title="Biometric login"
				description="Sign in with Face ID, Touch ID, your fingerprint or device PIN instead of a password"
			/>

			{!supported ? (
				<p className="text-sm text-muted-foreground">
					This browser doesn't support passkeys. Try a recent version of Chrome,
					Safari, Edge or Firefox.
				</p>
			) : (
				<div className="flex flex-col items-start space-y-4">
					{loading ? (
						<Spinner />
					) : passkeys.length > 0 ? (
						<ul className="w-full divide-y rounded-lg border">
							{passkeys.map((passkey) => (
								<li
									key={passkey.id}
									className="flex items-center justify-between gap-4 p-3">
									<div className="flex items-center gap-3">
										<Fingerprint className="size-5 text-muted-foreground" />
										<div>
											<p className="text-sm font-medium">
												{passkey.name}
												{passkey.authenticator && (
													<span className="text-muted-foreground">
														{" "}
														· {passkey.authenticator}
													</span>
												)}
											</p>
											<p className="text-xs text-muted-foreground">
												{passkey.last_used_at
													? `Last used ${formatDistanceToNow(new Date(passkey.last_used_at), { addSuffix: true })}`
													: "Never used"}
											</p>
										</div>
									</div>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										aria-label={`Remove ${passkey.name}`}
										disabled={deletingId === passkey.id}
										onClick={() => handleDelete(passkey)}>
										{deletingId === passkey.id ? <Spinner /> : <Trash2 />}
									</Button>
								</li>
							))}
						</ul>
					) : (
						<p className="text-sm text-muted-foreground">
							You haven't set up biometric login on any device yet.
						</p>
					)}

					<Button
						type="button"
						disabled={registering}
						onClick={handleRegister}
						data-test="register-passkey-button">
						{registering ? <Spinner /> : <Fingerprint />}
						Enable on this device
					</Button>
					<InputError message={error} />
				</div>
			)}
			<PasskeyConfirmationDialog
				isOpen={pendingAction !== null}
				onClose={() => setPendingAction(null)}
				onContinue={handleConfirmed}
			/>
		</div>
	)
}
