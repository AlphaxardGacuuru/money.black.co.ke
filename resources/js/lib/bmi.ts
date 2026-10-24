export type BmiCategory = {
	label: string
	/** Lower bound (inclusive). */
	min: number
	tone: "warning" | "healthy" | "danger"
}

/** WHO adult BMI categories. */
export const bmiCategories: BmiCategory[] = [
	{ label: "Underweight", min: 0, tone: "warning" },
	{ label: "Healthy weight", min: 18.5, tone: "healthy" },
	{ label: "Overweight", min: 25, tone: "warning" },
	{ label: "Obesity (class I)", min: 30, tone: "danger" },
	{ label: "Obesity (class II)", min: 35, tone: "danger" },
	{ label: "Obesity (class III)", min: 40, tone: "danger" },
]

export const HEALTHY_BMI_MIN = 18.5
export const HEALTHY_BMI_MAX = 24.9

const POUNDS_TO_KG = 0.45359237
const INCHES_TO_CM = 2.54

export function poundsToKilograms(pounds: number): number {
	return pounds * POUNDS_TO_KG
}

export function kilogramsToPounds(kilograms: number): number {
	return kilograms / POUNDS_TO_KG
}

export function feetAndInchesToCentimetres(feet: number, inches: number): number {
	return (feet * 12 + inches) * INCHES_TO_CM
}

/**
 * Body mass index: weight (kg) divided by height (m) squared.
 * Returns null when the inputs are missing or implausible.
 */
export function calculateBmi(weightKg: number, heightCm: number): number | null {
	if (!(weightKg > 0) || !(heightCm > 0) || heightCm < 50 || heightCm > 280 || weightKg > 650) {
		return null
	}

	const heightM = heightCm / 100

	return weightKg / (heightM * heightM)
}

export function bmiCategoryFor(bmi: number): BmiCategory {
	return [...bmiCategories].reverse().find((category) => bmi >= category.min) ?? bmiCategories[0]
}

/**
 * The weight range (kg) that gives a healthy BMI at the given height.
 */
export function healthyWeightRange(heightCm: number): { min: number; max: number } {
	const heightM = heightCm / 100

	return {
		min: HEALTHY_BMI_MIN * heightM * heightM,
		max: HEALTHY_BMI_MAX * heightM * heightM,
	}
}
