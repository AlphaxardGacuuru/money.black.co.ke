import { REGEXP_ONLY_DIGITS } from "input-otp"
import { CircleCheck, Fingerprint, Mail } from "lucide-react"
import { useEffect, useState } from "react"
import InputError from "@/components/input-error"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "@/components/ui/input-otp"
import { Spinner } from "@/components/ui/spinner"
import { OTP_MAX_LENGTH } from "@/hooks/use-two-factor-auth"
import axios from "@/lib/axios"
import {
	getPasskey,
	isPasskeyCancellation,
	type RequestOptionsJSON,
} from "@/lib/passkeys"
import {
	email as sendEmailCode,
	options as confirmationOptions,
	show as confirmationStatus,
	store as confirmWithPasskey,
} from "@/routes/passkey/confirmation"
import { verify as verifyEmailCode } from "@/routes/passkey/confirmation/email"

type Method = "passkey" | "email"

type Step = "loading" | "choose" | "email-sent" | "confirmed"

type Props = {
	isOpen: boolean
	onClose: () => void
	/** Called from the "Continue" tap so any follow-up biometric prompt has a fresh user gesture. */
	onContinue: () => void
}

function firstError(err: unknown, field: string, fallback: string): string {
	const e = err as {
		response?: {
			status?: number
			data?: { message?: string; errors?: Record<string, string[]> }
		}
	}

	if (e.response?.status === 429) {
		return "Too many attempts. Please wait a minute and try again."
	}

	return e.response?.data?.errors?.[field]?.[0] ?? e.response?.data?.message ?? fallback
}

export default function PasskeyConfirmationDialog({ isOpen, onClose, onContinue }: Props) {
	const [step, setStep] = useState<Step>("loading")
	const [methods, setMethods] = useState<Method[]>([])
	const [maskedEmail, setMaskedEmail] = useState("")
	const [code, setCode] = useState("")
	const [processing, setProcessing] = useState(false)
	const [error, setError] = useState<string>()

	useEffect(() => {
		if (!isOpen) {
			return
		}

		setStep("loading")
		setCode("")
		setError(undefined)

		axios
			.get<{ confirmed: boolean; methods: Method[]; email: string }>(confirmationStatus().url)
			.then(({ data }) => {
				setMethods(data.methods)
				setMaskedEmail(data.email)
				setStep(data.confirmed ? "confirmed" : "choose")
			})
			.catch(() => {
				setError("Couldn't start verification. Please try again.")
				setStep("choose")
			})
	}, [isOpen])

	async function handlePasskey() {
		setProcessing(true)
		setError(undefined)

		try {
			const { data } = await axios.get<{ options: RequestOptionsJSON }>(confirmationOptions().url)
			const credential = await getPasskey(data.options)
			const { url, method } = confirmWithPasskey()
			await axios.request({ url, method, data: { credential } })
			setStep("confirmed")
		} catch (err: unknown) {
			if (!isPasskeyCancellation(err)) {
				setError(firstError(err, "credential", "Biometric check failed. Try the email code instead."))
			}
		} finally {
			setProcessing(false)
		}
	}

	async function handleSendCode() {
		setProcessing(true)
		setError(undefined)

		try {
			const { url, method } = sendEmailCode()
			await axios.request({ url, method })
			setCode("")
			setStep("email-sent")
		} catch (err: unknown) {
			setError(firstError(err, "email", "Couldn't send the code. Please try again."))
		} finally {
			setProcessing(false)
		}
	}

	async function handleVerifyCode(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setProcessing(true)
		setError(undefined)

		try {
			const { url, method } = verifyEmailCode()
			await axios.request({ url, method, data: { code } })
			setStep("confirmed")
		} catch (err: unknown) {
			setCode("")
			setError(firstError(err, "code", "That code didn't work. Please try again."))
		} finally {
			setProcessing(false)
		}
	}

	const canUsePasskey = methods.includes("passkey")

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						{step === "confirmed" ? "You're verified" : "Confirm it's you"}
					</DialogTitle>
					<DialogDescription>
						{step === "confirmed"
							? "You can now change biometric login for the next 10 minutes."
							: step === "email-sent"
								? `Enter the 6-digit code we sent to ${maskedEmail}.`
								: "For your security, verify your identity before changing biometric login."}
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col items-stretch gap-3">
					{step === "loading" && (
						<div className="flex justify-center py-4">
							<Spinner />
						</div>
					)}

					{step === "choose" && (
						<>
							{canUsePasskey && (
								<Button
									type="button"
									disabled={processing}
									onClick={handlePasskey}>
									{processing ? <Spinner /> : <Fingerprint />}
									Confirm with biometrics
								</Button>
							)}
							<Button
								type="button"
								variant={canUsePasskey ? "outline" : "default"}
								disabled={processing}
								onClick={handleSendCode}>
								{processing && !canUsePasskey ? <Spinner /> : <Mail />}
								Email me a code{maskedEmail && ` at ${maskedEmail}`}
							</Button>
						</>
					)}

					{step === "email-sent" && (
						<form
							onSubmit={handleVerifyCode}
							className="flex flex-col items-center gap-4">
							<InputOTP
								id="passkey-confirmation-code"
								name="code"
								maxLength={OTP_MAX_LENGTH}
								value={code}
								onChange={setCode}
								disabled={processing}
								autoFocus
								pattern={REGEXP_ONLY_DIGITS}>
								<InputOTPGroup>
									{Array.from({ length: OTP_MAX_LENGTH }, (_, index) => (
										<InputOTPSlot
											key={index}
											index={index}
										/>
									))}
								</InputOTPGroup>
							</InputOTP>

							<div className="flex w-full gap-3">
								<Button
									type="button"
									variant="outline"
									className="flex-1"
									disabled={processing}
									onClick={handleSendCode}>
									Resend code
								</Button>
								<Button
									type="submit"
									className="flex-1"
									disabled={processing || code.length < OTP_MAX_LENGTH}>
									Verify
									{processing && <Spinner />}
								</Button>
							</div>
						</form>
					)}

					{step === "confirmed" && (
						<>
							<div className="flex justify-center py-2">
								<CircleCheck className="size-10 text-green-600" />
							</div>
							<Button
								type="button"
								onClick={onContinue}>
								Continue
							</Button>
						</>
					)}

					<InputError
						message={error}
						className="text-center"
					/>
				</div>
			</DialogContent>
		</Dialog>
	)
}
