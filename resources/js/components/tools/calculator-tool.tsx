import { Equal } from "lucide-react"
import { useEffect, useState } from "react"
import CalculatorKeypad, {
	calculatorActionClass,
	calculatorSideClass,
} from "@/components/calculator-keypad"
import {
	applyCalculatorKey,
	evaluateExpression,
	formatCalculatorNumber,
	type CalculatorKey,
} from "@/lib/calculator"

const KEYBOARD_KEYS: Record<string, CalculatorKey> = {
	"0": "0",
	"1": "1",
	"2": "2",
	"3": "3",
	"4": "4",
	"5": "5",
	"6": "6",
	"7": "7",
	"8": "8",
	"9": "9",
	".": ".",
	",": ".",
	"+": "+",
	"-": "-",
	"*": "*",
	x: "*",
	"/": "/",
	Backspace: "⌫",
}

export default function CalculatorTool() {
	const [expression, setExpression] = useState("")
	const [justEvaluated, setJustEvaluated] = useState(false)

	const result = expression ? evaluateExpression(expression) : 0

	function handleKey(key: CalculatorKey) {
		setExpression((current) => {
			// Typing a digit right after "=" starts a fresh calculation.
			const isDigit = /^[0-9.]/.test(key)
			const base = justEvaluated && isDigit ? "" : current

			return applyCalculatorKey(base, key, { allowDecimal: true })
		})
		setJustEvaluated(false)
	}

	function handleEquals() {
		if (!expression) {
			return
		}

		setExpression(String(result))
		setJustEvaluated(true)
	}

	function handleClear() {
		setExpression("")
		setJustEvaluated(false)
	}

	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
				return
			}

			if (event.key === "Enter" || event.key === "=") {
				event.preventDefault()
				handleEquals()

				return
			}

			if (event.key === "Escape" || event.key === "Delete") {
				handleClear()

				return
			}

			const key = KEYBOARD_KEYS[event.key]

			if (key) {
				event.preventDefault()
				handleKey(key)
			}
		}

		window.addEventListener("keydown", onKeyDown)

		return () => window.removeEventListener("keydown", onKeyDown)
	})

	const displayExpression = expression.replace(/\*/g, "×").replace(/\//g, "÷").replace(/-/g, "−")

	return (
		<div className="mx-auto w-full max-w-sm space-y-3">
			<div
				className="rounded-4xl border border-border/60 bg-muted/40 px-5 py-3 text-right"
				aria-live="polite">
				<p className="min-h-7 text-xl font-medium tracking-tight break-all text-muted-foreground tabular-nums">
					{displayExpression || "0"}
				</p>
				<p className="mt-0.5 text-4xl font-light tracking-tight break-all tabular-nums">
					{formatCalculatorNumber(result)}
				</p>
			</div>

			<CalculatorKeypad
				allowDecimal
				onKey={handleKey}
				sideSlot={
					<button
						type="button"
						onClick={handleClear}
						aria-label="Clear"
						className={calculatorSideClass}>
						C
					</button>
				}
				actionSlot={
					<button
						type="button"
						onClick={handleEquals}
						aria-label="Equals"
						className={calculatorActionClass}>
						<Equal className="size-8" />
					</button>
				}
			/>
		</div>
	)
}
