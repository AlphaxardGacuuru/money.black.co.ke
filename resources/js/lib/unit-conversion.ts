export type UnitDefinition = {
	id: string
	label: string
	symbol: string
	/** How many base units (metres or square metres) one of this unit equals. */
	toBase: number
}

/** Length units, based on the metre. Imperial factors are exact by definition. */
export const lengthUnits: UnitDefinition[] = [
	{ id: "mm", label: "Millimetres", symbol: "mm", toBase: 0.001 },
	{ id: "cm", label: "Centimetres", symbol: "cm", toBase: 0.01 },
	{ id: "m", label: "Metres", symbol: "m", toBase: 1 },
	{ id: "km", label: "Kilometres", symbol: "km", toBase: 1000 },
	{ id: "in", label: "Inches", symbol: "in", toBase: 0.0254 },
	{ id: "ft", label: "Feet", symbol: "ft", toBase: 0.3048 },
	{ id: "yd", label: "Yards", symbol: "yd", toBase: 0.9144 },
	{ id: "mi", label: "Miles", symbol: "mi", toBase: 1609.344 },
	{ id: "nmi", label: "Nautical miles", symbol: "nmi", toBase: 1852 },
]

/** Area units, based on the square metre. */
export const areaUnits: UnitDefinition[] = [
	{ id: "mm2", label: "Square millimetres", symbol: "mm²", toBase: 0.000001 },
	{ id: "cm2", label: "Square centimetres", symbol: "cm²", toBase: 0.0001 },
	{ id: "m2", label: "Square metres", symbol: "m²", toBase: 1 },
	{ id: "ha", label: "Hectares", symbol: "ha", toBase: 10_000 },
	{ id: "km2", label: "Square kilometres", symbol: "km²", toBase: 1_000_000 },
	{ id: "in2", label: "Square inches", symbol: "in²", toBase: 0.00064516 },
	{ id: "ft2", label: "Square feet", symbol: "ft²", toBase: 0.09290304 },
	{ id: "yd2", label: "Square yards", symbol: "yd²", toBase: 0.83612736 },
	{ id: "acre", label: "Acres", symbol: "ac", toBase: 4046.8564224 },
	{ id: "mi2", label: "Square miles", symbol: "mi²", toBase: 2_589_988.110336 },
]

export function convertUnits(value: number, from: UnitDefinition, to: UnitDefinition): number {
	return (value * from.toBase) / to.toBase
}

/**
 * Format a converted value: plain digits for everyday sizes, scientific
 * notation for values too small or large to read at a glance.
 */
export function formatConvertedValue(value: number): string {
	if (!isFinite(value)) {
		return "—"
	}

	if (value === 0) {
		return "0"
	}

	const magnitude = Math.abs(value)

	if (magnitude < 0.000001 || magnitude >= 1e15) {
		return value.toExponential(4)
	}

	return value.toLocaleString("en-KE", { maximumSignificantDigits: 10 })
}
