"use client"

import React, { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"
import { ChevronDownSVG } from "@/svgs"
import * as AllIcons from "@/svgs"

// Helper to format labels
const formatLabel = (name) => {
	return name
		.replace(/SVG$/, "")
		.replace(/([A-Z])/g, " $1")
		.trim()
}

const IconInput = ({ value, onChange, label = "Icon", className }) => {
	const [open, setOpen] = useState(false)

	const iconOptions = useMemo(() => {
		return Object.entries(AllIcons)
			.filter(([key]) => key !== "default" && key.endsWith("SVG")) // Filter out non-components if any
			.filter(([key]) => key !== "LogoSVG") // Filter out non-components if any
			.map(([key, Component]) => ({
				value: key,
				label: formatLabel(key),
				icon: Component,
			}))
			.sort((a, b) => a.label.localeCompare(b.label))
	}, [])

	const selectedOption = iconOptions.find((opt) => opt.value === value)
	const SelectedIcon = selectedOption ? selectedOption.icon : null

	return (
		<div className={cn("relative group", className)}>
			<Label
				className={cn(
					"absolute left-4 transition-all duration-200 pointer-events-none font-light font-nunito z-10",
					value
						? "top-1.5 text-xs text-white/60"
						: "top-4 text-base text-white/40"
				)}>
				{label}
			</Label>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<button
						type="button"
						className="w-full h-14 flex items-center justify-between rounded-lg border border-white/20 bg-transparent px-4 pt-4 text-white font-light font-nunito hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all text-left">
						<span className="flex items-center gap-2">
							{SelectedIcon ? (
								<>
									<SelectedIcon className="w-5 h-5 text-emerald-400" />
									<span>{selectedOption.label}</span>
								</>
							) : (
								<span className="text-transparent">Select</span>
							)}
						</span>
						<ChevronDownSVG className="w-4 h-4 opacity-50" />
					</button>
				</PopoverTrigger>
				<PopoverContent className="w-96 p-0 bg-[#0a0a0a] border border-white/10 text-white rounded-xl backdrop-blur-xl overflow-hidden shadow-2xl">
					<div className="p-3 grid grid-cols-4 gap-2 h-80 overflow-y-auto custom-scrollbar">
						{iconOptions.map((item) => (
							<button
								key={item.value}
								type="button"
								onClick={() => {
									onChange(item.value)
									setOpen(false)
								}}
								className={cn(
									"aspect-square rounded-lg hover:bg-white/10 flex flex-col items-center justify-center gap-2 transition-all",
									value === item.value
										? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
										: "text-white/70"
								)}
								title={item.label}>
								<item.icon className="w-6 h-6" />
								<span className="text-[10px] truncate w-full text-center px-1">
									{item.label}
								</span>
							</button>
						))}
					</div>
				</PopoverContent>
			</Popover>
		</div>
	)
}

export default IconInput
