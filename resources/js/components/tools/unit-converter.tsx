import { ArrowLeftRight } from "lucide-react"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SelectField, SelectItem } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { convertUnits, formatConvertedValue, type UnitDefinition } from "@/lib/unit-conversion"

type Props = {
	units: UnitDefinition[]
	defaultFrom: string
	defaultTo: string
}

/**
 * Converts a value between units of one kind (length, area, …) and lists the
 * value in every other unit underneath.
 */
export default function UnitConverter({ units, defaultFrom, defaultTo }: Props) {
	const [value, setValue] = useState("1")
	const [fromId, setFromId] = useState(defaultFrom)
	const [toId, setToId] = useState(defaultTo)

	const unitsById = useMemo(() => Object.fromEntries(units.map((unit) => [unit.id, unit])), [units])
	const from = unitsById[fromId]
	const to = unitsById[toId]

	const numericValue = Number(value.replace(/,/g, ""))
	const isValid = value.trim() !== "" && isFinite(numericValue)

	function swapUnits() {
		setFromId(toId)
		setToId(fromId)
	}

	return (
		<div className="mx-auto w-full max-w-xl space-y-6">
			<div className="grid gap-3">
				<Input
					id="convert-value"
					label={`Value (${from.symbol})`}
					type="text"
					inputMode="decimal"
					value={value}
					onChange={(event) => setValue(event.target.value)}
					error={value.trim() !== "" && !isValid ? "Enter a number" : undefined}
				/>

				<div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
					<SelectField
						name="from-unit"
						label="From"
						value={fromId}
						onValueChange={setFromId}>
						{units.map((unit) => (
							<SelectItem
								key={unit.id}
								value={unit.id}>
								{unit.label} ({unit.symbol})
							</SelectItem>
						))}
					</SelectField>

					<Button
						type="button"
						variant="ghost"
						size="icon"
						aria-label="Swap units"
						onClick={swapUnits}>
						<ArrowLeftRight />
					</Button>

					<SelectField
						name="to-unit"
						label="To"
						value={toId}
						onValueChange={setToId}>
						{units.map((unit) => (
							<SelectItem
								key={unit.id}
								value={unit.id}>
								{unit.label} ({unit.symbol})
							</SelectItem>
						))}
					</SelectField>
				</div>
			</div>

			<div
				className="rounded-4xl border border-border/60 bg-muted/40 px-5 py-4 text-right"
				aria-live="polite">
				<p className="text-sm text-muted-foreground">
					{isValid ? formatConvertedValue(numericValue) : "0"} {from.symbol} =
				</p>
				<p className="mt-1 text-3xl font-light tracking-tight break-all tabular-nums">
					{isValid ? formatConvertedValue(convertUnits(numericValue, from, to)) : "0"}{" "}
					<span className="text-xl text-muted-foreground">{to.symbol}</span>
				</p>
			</div>

			{isValid && (
				<ul className="divide-y rounded-xl border text-sm">
					{units
						.filter((unit) => unit.id !== fromId)
						.map((unit) => (
							<li key={unit.id}>
								<button
									type="button"
									onClick={() => setToId(unit.id)}
									className={cn(
										"flex w-full justify-between gap-4 px-4 py-2.5 text-left hover:bg-accent/50",
										unit.id === toId && "bg-accent/40 font-medium"
									)}>
									<span className="text-muted-foreground">{unit.label}</span>
									<span className="tabular-nums">
										{formatConvertedValue(convertUnits(numericValue, from, unit))} {unit.symbol}
									</span>
								</button>
							</li>
						))}
				</ul>
			)}
		</div>
	)
}
