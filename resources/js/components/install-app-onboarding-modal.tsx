import { Download } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { useIsMobile } from "@/hooks/use-mobile"
import { usePwaInstall } from "@/hooks/use-pwa-install"
import toast from "@/lib/toast"

const DISMISSED_KEY = "install-prompt-dismissed"

function wasDismissedThisSession(): boolean {
	return sessionStorage.getItem(DISMISSED_KEY) === "1"
}

export default function InstallAppOnboardingModal() {
	const { canInstall, install, isInstalled } = usePwaInstall()
	const isMobile = useIsMobile()

	const [open, setOpen] = useState(false)
	const [processing, setProcessing] = useState(false)

	useEffect(() => {
		if (wasDismissedThisSession()) {
			return
		}

		if (isInstalled || !canInstall) {
			setOpen(false)
			return
		}

		setOpen(isMobile)
	}, [isInstalled, canInstall, isMobile])

	async function handleInstall() {
		setProcessing(true)

		try {
			const accepted = await install()

			if (accepted) {
				toast.success("Black Money installed", {
					description: "Find it on your home screen for quick access.",
				})
			}

			setOpen(false)
		} finally {
			setProcessing(false)
		}
	}

	function handleSkip() {
		sessionStorage.setItem(DISMISSED_KEY, "1")
		setOpen(false)
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (!next) {
					handleSkip()
				}
			}}>
			<DialogContent className="sm:max-w-sm">
				<div className="flex flex-col items-center gap-4 pt-2 text-center">
					<div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
						<Download className="size-8 text-primary" />
					</div>
					<DialogHeader className="items-center gap-2">
						<DialogTitle>Install Black Money</DialogTitle>
						<DialogDescription>
							Install the app for quick access to your money from your
							home screen, in a window of its own.
						</DialogDescription>
					</DialogHeader>
				</div>
				<DialogFooter className="sm:justify-center">
					<Button
						type="button"
						variant="outline"
						disabled={processing}
						onClick={handleSkip}>
						Not now
					</Button>
					<Button
						type="button"
						disabled={processing}
						onClick={() => void handleInstall()}>
						{processing && <Spinner className="size-4" />}
						Install app
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
