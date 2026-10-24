export type CalculatorKey =
	| "0"
	| "1"
	| "2"
	| "3"
	| "4"
	| "5"
	| "6"
	| "7"
	| "8"
	| "9"
	| "00"
	| "."
	| "+"
	| "-"
	| "*"
	| "/"
	| "⌫"

const OPERATORS = ["+", "-", "*", "/"]

/**
 * Evaluate a calculator expression with normal precedence (× and ÷ before + and −).
 * Division by zero yields 0, matching the transaction sheet's long-standing behaviour.
 */
export function evaluateExpression(expression: string): number {
	const tokens = expression.match(/\d+\.?\d*|\.\d+|[+\-*/]/g) ?? []
	let index = 0

	function parseExpression(): number {
		let left = parseTerm()

		while (index < tokens.length && (tokens[index] === "+" || tokens[index] === "-")) {
			const operator = tokens[index++]
			const right = parseTerm()
			left = operator === "+" ? left + right : left - right
		}

		return left
	}

	function parseTerm(): number {
		let left = parseNumber()

		while (index < tokens.length && (tokens[index] === "*" || tokens[index] === "/")) {
			const operator = tokens[index++]
			const right = parseNumber()
			left = operator === "*" ? left * right : right !== 0 ? left / right : 0
		}

		return left
	}

	function parseNumber(): number {
		const token = tokens[index++]

		// A leading minus, e.g. a negative result carried into the next calculation.
		if (token === "-") {
			return -parseNumber()
		}

		return isNaN(Number(token)) ? 0 : Number(token)
	}

	// Trim floating-point noise such as 0.1 + 0.2 = 0.30000000000000004.
	return Number(parseExpression().toFixed(10))
}

/**
 * Apply a key press to the current expression and return the new expression.
 */
export function applyCalculatorKey(
	expression: string,
	key: CalculatorKey,
	{ allowDecimal = false }: { allowDecimal?: boolean } = {}
): string {
	if (key === "⌫") {
		return expression.slice(0, -1)
	}

	if (OPERATORS.includes(key)) {
		if (!expression) {
			return expression
		}

		if (OPERATORS.includes(expression.slice(-1))) {
			return expression.slice(0, -1) + key
		}

		return expression + key
	}

	if (key === ".") {
		if (!allowDecimal) {
			return expression
		}

		const currentNumber = expression.split(/[+\-*/]/).pop() ?? ""

		if (currentNumber.includes(".")) {
			return expression
		}

		return expression + (currentNumber === "" ? "0." : ".")
	}

	const currentNumber = expression.split(/[+\-*/]/).pop() ?? ""

	if (key === "00" && currentNumber === "") {
		return expression + "0"
	}

	if (currentNumber === "0") {
		return expression.slice(0, -1) + (key === "00" ? "0" : key)
	}

	return expression + key
}

/**
 * Format a calculator result for display.
 */
export function formatCalculatorNumber(value: number): string {
	if (!isFinite(value)) {
		return "0"
	}

	return value.toLocaleString("en-KE", { maximumFractionDigits: 8 })
}
