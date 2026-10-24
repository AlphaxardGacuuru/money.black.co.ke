import { useState } from "react"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
	bmiCategories,
	bmiCategoryFor,
	calculateBmi,
	feetAndInchesToCentimetres,
	healthyWeightRange,
	kilogramsToPounds,
	poundsToKilograms,
	type BmiCategory,
} from "@/lib/bmi"
import { cn } from "@/lib/utils"

type UnitSystem = "metric" | "imperial"

const toneClasses: Record<BmiCategory["tone"], string> = {
	healthy: "text-green-600 dark:text-green-400",
	warning: "text-amber-600 dark:text-amber-400",
	danger: "text-red-600 dark:text-red-400",
}

const toNumber = (value: string) => Number(value.replace(/,/g, "")) || 0

export default function BmiCalculator() {
	const [system, setSystem] = useState<UnitSystem>("metric")
	const [weightKg, setWeightKg] = useState("")
	const [heightCm, setHeightCm] = useState("")
	const [weightLb, setWeightLb] = useState("")
	const [heightFt, setHeightFt] = useState("")
	const [heightIn, setHeightIn] = useState("")

	const weight = system === "metric" ? toNumber(weightKg) : poundsToKilograms(toNumber(weightLb))
	const height =
		system === "metric" ? toNumber(heightCm) : feetAndInchesToCentimetres(toNumber(heightFt), toNumber(heightIn))

	const bmi = calculateBmi(weight, height)
	const category = bmi === null ? null : bmiCategoryFor(bmi)
	const healthyRange = bmi === null ? null : healthyWeightRange(height)
	const hasInput = weight > 0 && height > 0

	function formatWeight(kg: number) {
		return system === "metric" ? `${kg.toFixed(1)} kg` : `${kilogramsToPounds(kg).toFixed(0)} lb`
	}

	return (
		<div className="mx-auto w-full max-w-xl space-y-6">
			<ToggleGroup
				type="single"
				variant="outline"
				value={system}
				onValueChange={(next) => next && setSystem(next as UnitSystem)}
				aria-label="Unit system">
				<ToggleGroupItem value="metric">Metric (kg, cm)</ToggleGroupItem>
				<ToggleGroupItem value="imperial">Imperial (lb, ft)</ToggleGroupItem>
			</ToggleGroup>

			{system === "metric" ? (
				<div className="grid gap-3 sm:grid-cols-2">
					<Input
						id="bmi-weight-kg"
						label="Weight (kg)"
						inputMode="decimal"
						value={weightKg}
						onChange={(event) => setWeightKg(event.target.value)}
					/>
					<Input
						id="bmi-height-cm"
						label="Height (cm)"
						inputMode="decimal"
						value={heightCm}
						onChange={(event) => setHeightCm(event.target.value)}
					/>
				</div>
			) : (
				<div className="grid gap-3 sm:grid-cols-3">
					<Input
						id="bmi-weight-lb"
						label="Weight (lb)"
						inputMode="decimal"
						value={weightLb}
						onChange={(event) => setWeightLb(event.target.value)}
					/>
					<Input
						id="bmi-height-ft"
						label="Height (ft)"
						inputMode="numeric"
						value={heightFt}
						onChange={(event) => setHeightFt(event.target.value)}
					/>
					<Input
						id="bmi-height-in"
						label="(in)"
						inputMode="decimal"
						value={heightIn}
						onChange={(event) => setHeightIn(event.target.value)}
					/>
				</div>
			)}

			<div
				className="rounded-4xl border border-border/60 bg-muted/40 px-5 py-4"
				aria-live="polite">
				{bmi !== null && category && healthyRange ? (
					<div className="space-y-2">
						<div className="flex items-baseline justify-between gap-4">
							<p className="text-sm text-muted-foreground">Your BMI</p>
							<p className="text-4xl font-light tabular-nums">{bmi.toFixed(1)}</p>
						</div>
						<p className={cn("text-right text-lg font-medium", toneClasses[category.tone])}>
							{category.label}
						</p>
						<p className="text-sm text-muted-foreground">
							A healthy weight for your height is {formatWeight(healthyRange.min)} to{" "}
							{formatWeight(healthyRange.max)}.
						</p>
					</div>
				) : (
					<p className="text-sm text-muted-foreground">
						{hasInput ? "Check your weight and height." : "Enter your weight and height."}
					</p>
				)}
			</div>

			<ul className="divide-y rounded-xl border text-sm">
				{bmiCategories.map((item, index) => {
					const next = bmiCategories[index + 1]

					return (
						<li
							key={item.label}
							className={cn(
								"flex justify-between px-4 py-2",
								category?.label === item.label && "bg-accent/40 font-medium"
							)}>
							<span>{item.label}</span>
							<span className="text-muted-foreground tabular-nums">
								{index === 0 ? `Below ${next.min}` : next ? `${item.min} – ${(next.min - 0.1).toFixed(1)}` : `${item.min} and above`}
							</span>
						</li>
					)
				})}
			</ul>

			<p className="text-xs text-muted-foreground">
				For adults 18 and over, using WHO categories. BMI doesn't account for muscle, age, sex or ethnicity, so treat
				it as a rough guide, not a diagnosis.
			</p>
		</div>
	)
}
