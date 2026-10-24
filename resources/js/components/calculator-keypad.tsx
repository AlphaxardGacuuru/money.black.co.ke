import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import type { CalculatorKey } from "@/lib/calculator"

type Props = {
	onKey: (key: CalculatorKey) => void
	/** Cell under backspace in the right-hand column (e.g. a date picker or a clear key). */
	sideSlot?: ReactNode
	/** Tall cell at the bottom of the right-hand column (e.g. submit or equals). */
	actionSlot: ReactNode
	/** Show the decimal point and double-zero keys in the bottom row. */
	allowDecimal?: boolean
}

const digitClass =
	"flex h-14 items-center justify-center rounded-4xl bg-muted text-2xl font-light transition-all hover:bg-muted/70 active:scale-[0.95]"

const operatorClass =
	"flex h-14 items-center justify-center rounded-4xl bg-primary/50 text-2xl font-light text-primary transition-all hover:bg-primary/20 active:scale-[0.95]"

export const calculatorActionClass =
	"row-span-2 flex items-center justify-center rounded-4xl bg-primary text-sm font-light text-primary-foreground transition-all hover:bg-primary/80 active:scale-[0.95] disabled:cursor-not-allowed disabled:opacity-50"

export const calculatorSideClass =
	"flex h-14 items-center justify-center rounded-4xl bg-muted/50 text-2xl font-light transition-all hover:bg-muted active:scale-[0.95]"

function Key({
	label,
	value,
	onKey,
	className = digitClass,
	ariaLabel,
}: {
	label: ReactNode
	value: CalculatorKey
	onKey: (key: CalculatorKey) => void
	className?: string
	ariaLabel?: string
}) {
	return (
		<button
			type="button"
			aria-label={ariaLabel}
			onClick={() => onKey(value)}
			className={className}>
			{label}
		</button>
	)
}

/**
 * The calculator keypad shared by the transaction sheet and the calculator page.
 */
export default function CalculatorKeypad({ onKey, sideSlot, actionSlot, allowDecimal = false }: Props) {
	return (
		<div className="grid grid-cols-5 gap-1">
			<Key
				label="÷"
				value="/"
				ariaLabel="Divide"
				onKey={onKey}
				className={operatorClass}
			/>
			{(["7", "8", "9"] as const).map((digit) => (
				<Key
					key={digit}
					label={digit}
					value={digit}
					onKey={onKey}
				/>
			))}
			<Key
				label="⌫"
				value="⌫"
				ariaLabel="Backspace"
				onKey={onKey}
				className={calculatorSideClass}
			/>

			<Key
				label="×"
				value="*"
				ariaLabel="Multiply"
				onKey={onKey}
				className={operatorClass}
			/>
			{(["4", "5", "6"] as const).map((digit) => (
				<Key
					key={digit}
					label={digit}
					value={digit}
					onKey={onKey}
				/>
			))}
			{sideSlot ?? <span />}

			<Key
				label="−"
				value="-"
				ariaLabel="Subtract"
				onKey={onKey}
				className={operatorClass}
			/>
			{(["1", "2", "3"] as const).map((digit) => (
				<Key
					key={digit}
					label={digit}
					value={digit}
					onKey={onKey}
				/>
			))}
			{actionSlot}

			<Key
				label="+"
				value="+"
				ariaLabel="Add"
				onKey={onKey}
				className={operatorClass}
			/>
			{allowDecimal ? (
				<Key
					label="."
					value="."
					ariaLabel="Decimal point"
					onKey={onKey}
				/>
			) : (
				<button
					type="button"
					aria-hidden
					tabIndex={-1}
					className={cn(digitClass)}
				/>
			)}
			<Key
				label="0"
				value="0"
				onKey={onKey}
			/>
			{allowDecimal ? (
				<Key
					label="00"
					value="00"
					onKey={onKey}
				/>
			) : (
				<button
					type="button"
					aria-hidden
					tabIndex={-1}
					className={cn(digitClass)}
				/>
			)}
		</div>
	)
}
