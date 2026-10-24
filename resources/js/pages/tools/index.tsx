import { Head } from "@/lib/spa"
import { Calculator, HeartPulse, Ruler, SquareDashed } from "lucide-react"
import { useEffect, useState } from "react"
import BmiCalculator from "@/components/tools/bmi-calculator"
import CalculatorTool from "@/components/tools/calculator-tool"
import UnitConverter from "@/components/tools/unit-converter"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { areaUnits, lengthUnits } from "@/lib/unit-conversion"

const tools = [
	{ id: "calculator", label: "Calculator", icon: Calculator },
	{ id: "length", label: "Length", icon: Ruler },
	{ id: "area", label: "Area", icon: SquareDashed },
	{ id: "bmi", label: "BMI", icon: HeartPulse },
] as const

type ToolId = (typeof tools)[number]["id"]

function toolFromHash(): ToolId {
	const hash = window.location.hash.replace("#", "")

	return tools.some((tool) => tool.id === hash) ? (hash as ToolId) : "calculator"
}

export default function ToolsPage() {
	const [activeTool, setActiveTool] = useState<ToolId>(toolFromHash)

	useEffect(() => {
		const onHashChange = () => setActiveTool(toolFromHash())

		window.addEventListener("hashchange", onHashChange)

		return () => window.removeEventListener("hashchange", onHashChange)
	}, [])

	function selectTool(next: string) {
		if (!next) {
			return
		}

		setActiveTool(next as ToolId)
		window.history.replaceState(null, "", `#${next}`)
	}

	const activeLabel = tools.find((tool) => tool.id === activeTool)?.label ?? "Tools"

	return (
		<>
			<Head title={activeLabel} />

			<div className="flex flex-1 flex-col gap-6 p-4">
				<ToggleGroup
					type="single"
					variant="outline"
					value={activeTool}
					onValueChange={selectTool}
					aria-label="Choose a tool"
					className="mx-auto w-full max-w-xl">
					{tools.map((tool) => (
						<ToggleGroupItem
							key={tool.id}
							value={tool.id}
							aria-label={tool.label}
							className="flex-1 gap-1.5">
							<tool.icon className="size-4" />
							<span className="hidden sm:inline">{tool.label}</span>
						</ToggleGroupItem>
					))}
				</ToggleGroup>

				<h1 className="sr-only">{activeLabel}</h1>

				{activeTool === "calculator" && <CalculatorTool />}
				{activeTool === "length" && (
					<UnitConverter
						key="length"
						units={lengthUnits}
						defaultFrom="m"
						defaultTo="ft"
					/>
				)}
				{activeTool === "area" && (
					<UnitConverter
						key="area"
						units={areaUnits}
						defaultFrom="acre"
						defaultTo="m2"
					/>
				)}
				{activeTool === "bmi" && <BmiCalculator />}
			</div>
		</>
	)
}

ToolsPage.layout = {
	breadcrumbs: [{ title: "Tools", href: "/tools" }],
}
