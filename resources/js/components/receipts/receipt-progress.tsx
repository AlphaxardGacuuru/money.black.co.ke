import { CircleCheck, Circle, RotateCcw } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { useNow } from "@/hooks/use-now"
import {
	MAX_SCAN_ATTEMPTS,
	receiptProcessingSteps,
	receiptProgress,
	receiptProgressPercent,
	secondsSince,
} from "@/lib/receipts"
import { cn } from "@/lib/utils"
import type { Receipt } from "@/types/receipt"

function ProgressBar({ percent, className }: { percent: number; className?: string }) {
	return (
		<div
			role="progressbar"
			aria-valuemin={0}
			aria-valuemax={100}
			aria-valuenow={percent}
			className={cn("h-1.5 w-full overflow-hidden rounded-full bg-primary/10", className)}>
			<div
				className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-out motion-safe:animate-pulse"
				style={{ width: `${percent}%` }}
			/>
		</div>
	)
}

/**
 * Live, step-by-step progress for a receipt the AI is reading. The step is
 * stored on the server, so it picks up where it left off when the user comes back.
 */
export default function ReceiptProgress({ receipt }: { receipt: Receipt }) {
	const now = useNow()
	const { index, details, isRetrying, attempt } = receiptProgress(receipt)
	const secondsOnStep = secondsSince(receipt.processingStepAt, now)
	const isSlow = !isRetrying && secondsOnStep >= details.slowAfterSeconds

	return (
		<div
			className="flex flex-col gap-6"
			aria-live="polite"
			data-test="receipt-progress">
			<div className="space-y-1">
				<p className="font-medium">{isRetrying ? "Trying again…" : `${details.title}…`}</p>
				<p className="text-sm text-muted-foreground">
					{isRetrying
						? `The AI service didn't respond. We'll try again in a moment (attempt ${Math.min(attempt + 1, MAX_SCAN_ATTEMPTS)} of ${MAX_SCAN_ATTEMPTS}).`
						: details.description}
				</p>
			</div>

			<ProgressBar percent={receiptProgressPercent(receipt, secondsOnStep)} />

			<ol className="space-y-3 text-sm">
				<li className="flex items-center gap-3">
					<CircleCheck className="size-5 shrink-0 text-green-600" />
					<span>Uploaded</span>
				</li>
				{receiptProcessingSteps.map((step, stepIndex) => {
					const isDone = stepIndex < index
					const isCurrent = stepIndex === index

					return (
						<li
							key={step.step}
							aria-current={isCurrent ? "step" : undefined}
							className={cn(
								"flex items-center gap-3",
								!isDone && !isCurrent && "text-muted-foreground"
							)}>
							{isDone && <CircleCheck className="size-5 shrink-0 text-green-600" />}
							{isCurrent &&
								(isRetrying ? (
									<RotateCcw className="size-5 shrink-0 text-amber-600 motion-safe:animate-spin [animation-direction:reverse] [animation-duration:2s]" />
								) : (
									<Spinner className="size-5 shrink-0 text-primary" />
								))}
							{!isDone && !isCurrent && <Circle className="size-5 shrink-0 opacity-40" />}
							<span className={cn(isCurrent && "font-medium")}>{step.label}</span>
							{isCurrent && (
								<span className="ml-auto text-xs text-muted-foreground tabular-nums">
									{secondsOnStep}s
								</span>
							)}
						</li>
					)
				})}
			</ol>

			{isSlow && <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">{details.slowMessage}</p>}

			<p className="text-xs text-muted-foreground">
				You can leave this page. We'll keep going, and the receipt will be waiting in Receipts.
			</p>
		</div>
	)
}

/** A one-line version for the receipts list. */
export function ReceiptProgressSummary({ receipt }: { receipt: Receipt }) {
	const now = useNow()
	const { details, isRetrying } = receiptProgress(receipt)
	const secondsOnStep = secondsSince(receipt.processingStepAt, now)

	return (
		<div className="mt-1.5 space-y-1.5">
			<p className={cn("text-xs", isRetrying ? "text-amber-600" : "text-muted-foreground")}>
				{isRetrying ? "Trying again…" : `${details.label}…`}
			</p>
			<ProgressBar
				percent={receiptProgressPercent(receipt, secondsOnStep)}
				className="h-1 w-40 max-w-full"
			/>
		</div>
	)
}
