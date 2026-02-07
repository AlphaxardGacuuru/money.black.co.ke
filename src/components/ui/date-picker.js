"use client"

import * as React from "react"
import { useState, useEffect, useRef } from "react"
import {
	CalendarIcon,
	ChevronDownIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
} from "lucide-react"
import { DayPicker, getDefaultClassNames } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Btn, btnVariants } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"
import { InputWrapper } from "./input-wrapper"

function CalendarComponent({
	className,
	classNames,
	showOutsideDays = false,
	captionLayout = "label",
	buttonVariant = "ghost",
	formatters,
	components,
	...props
}) {
	const defaultClassNames = getDefaultClassNames()

	return (
		<DayPicker
			showOutsideDays={showOutsideDays}
			className={cn(
				"bg-background group/calendar p-3 [--cell-size:--spacing(8)] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
				String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
				String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
				className
			)}
			captionLayout={captionLayout}
			formatters={{
				formatMonthDropdown: (date) =>
					date.toLocaleString("default", { month: "short" }),
				...formatters,
			}}
			classNames={{
				root: cn("w-fit", defaultClassNames.root),
				months: cn(
					"flex gap-4 flex-col md:flex-row relative",
					defaultClassNames.months
				),
				month: cn("flex flex-col w-full gap-4", defaultClassNames.month),
				nav: cn(
					"flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between",
					defaultClassNames.nav
				),
				button_previous: cn(
					btnVariants({ variant: buttonVariant }),
					"size-(--cell-size) aria-disabled:opacity-50 p-0 select-none",
					defaultClassNames.button_previous
				),
				button_next: cn(
					btnVariants({ variant: buttonVariant }),
					"size-(--cell-size) aria-disabled:opacity-50 p-0 select-none",
					defaultClassNames.button_next
				),
				month_caption: cn(
					"flex items-center justify-center h-(--cell-size) w-full px-(--cell-size)",
					defaultClassNames.month_caption
				),
				dropdowns: cn(
					"w-full flex items-center text-sm font-medium justify-center h-(--cell-size) gap-1.5",
					defaultClassNames.dropdowns
				),
				dropdown_root: cn(
					"relative border border-white/20 bg-white/10 backdrop-blur-xl shadow-xs rounded-md text-white overflow-hidden min-h-[35px] flex items-center min-w-[90px]",
					defaultClassNames.dropdown_root
				),
				dropdown: cn(
					"absolute inset-0 w-full h-full cursor-pointer text-white bg-transparent appearance-none px-2 z-10 py-0 flex items-center",
					"[&>option]:bg-gray-900 [&>option]:text-white",
					defaultClassNames.dropdown
				),
				caption_label: cn(
					"select-none font-medium text-white pointer-events-none",
					captionLayout === "label"
						? "text-sm"
						: "opacity-0 rounded-md pl-2 pr-1 flex items-center gap-1 text-sm h-8 [&>svg]:text-white/60 [&>svg]:size-3.5 [&>svg]:pointer-events-none",
					defaultClassNames.caption_label
				),
				table: "w-full border-collapse",
				weekdays: cn("flex", defaultClassNames.weekdays),
				weekday: cn(
					"text-white/60 rounded-md flex-1 font-normal text-[0.8rem] select-none",
					defaultClassNames.weekday
				),
				week: cn("flex w-full mt-2", defaultClassNames.week),
				week_number_header: cn(
					"select-none w-(--cell-size)",
					defaultClassNames.week_number_header
				),
				week_number: cn(
					"text-[0.8rem] select-none text-white/60",
					defaultClassNames.week_number
				),
				day: cn(
					"relative w-full h-full p-0 text-center [&:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none",
					props.showWeekNumber
						? "[&:nth-child(2)[data-selected=true]_button]:rounded-l-md"
						: "[&:first-child[data-selected=true]_button]:rounded-l-md",
					defaultClassNames.day
				),
				range_start: cn(
					"rounded-l-md bg-white/20",
					defaultClassNames.range_start
				),
				range_middle: cn("rounded-none", defaultClassNames.range_middle),
				range_end: cn("rounded-r-md bg-white/20", defaultClassNames.range_end),
				today: cn(
					"bg-white/20 text-white rounded-md data-[selected=true]:rounded-none",
					defaultClassNames.today
				),
				outside: cn(
					"text-white/40 aria-selected:text-white/40",
					defaultClassNames.outside
				),
				disabled: cn("text-white/30 opacity-50", defaultClassNames.disabled),
				hidden: cn("invisible", defaultClassNames.hidden),
				...classNames,
			}}
			components={{
				Root: ({ className, rootRef, ...props }) => {
					return (
						<div
							data-slot="calendar"
							ref={rootRef}
							className={cn(className)}
							{...props}
						/>
					)
				},
				Chevron: ({ className, orientation, ...props }) => {
					if (orientation === "left") {
						return (
							<ChevronLeftIcon
								className={cn("size-4", className)}
								{...props}
							/>
						)
					}

					if (orientation === "right") {
						return (
							<ChevronRightIcon
								className={cn("size-4", className)}
								{...props}
							/>
						)
					}

					return (
						<ChevronDownIcon
							className={cn("size-4", className)}
							{...props}
						/>
					)
				},
				DayButton: CalendarDayButton,
				WeekNumber: ({ children, ...props }) => {
					return (
						<td {...props}>
							<div className="flex size-(--cell-size) items-center justify-center text-center">
								{children}
							</div>
						</td>
					)
				},
				...components,
			}}
			{...props}
		/>
	)
}

function CalendarDayButton({ className, day, modifiers, ...props }) {
	const defaultClassNames = getDefaultClassNames()

	const ref = useRef(null)
	useEffect(() => {
		if (modifiers.focused) ref.current?.focus()
	}, [modifiers.focused])

	return (
		<Btn
			ref={ref}
			variant="ghost"
			size="icon"
			data-day={day.date.toLocaleDateString("en-GB")}
			data-selected-single={
				modifiers.selected &&
				!modifiers.range_start &&
				!modifiers.range_end &&
				!modifiers.range_middle
			}
			data-range-start={modifiers.range_start}
			data-range-end={modifiers.range_end}
			data-range-middle={modifiers.range_middle}
			className={cn(
				"data-[selected-single=true]:bg-white/30 data-[selected-single=true]:text-white data-[range-middle=true]:bg-white/20 data-[range-middle=true]:text-white data-[range-start=true]:bg-white/30 data-[range-start=true]:text-white data-[range-end=true]:bg-white/30 data-[range-end=true]:text-white group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 hover:bg-white/20 hover:text-white flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&>span]:text-xs [&>span]:opacity-70",
				defaultClassNames.day,
				className
			)}
			{...props}
		/>
	)
}

export function DatePicker({
	className,
	label,
	error,
	helperText,
	value,
	onChange,
	...props
}) {
	const [open, setOpen] = useState(false)

	const isActive = value

	return (
		<div className={cn("relative w-full", className)}>
			<Popover
				open={open}
				onOpenChange={setOpen}>
				<InputWrapper error={error}>
					{({ focused, handleFocus, handleBlur }) => {
						const isActiveWithFocus = focused || isActive

						return (
							<>
								<PopoverTrigger asChild>
									<button
										type="button"
										className={cn(
											"relative flex h-14 w-full rounded-lg border bg-white/10 backdrop-blur-xl px-4 pt-5 pb-1 text-left text-white font-light font-nunito text-base transition-all",
											error
												? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
												: "border-white/20 focus:border-white/40 focus:ring-2 focus:ring-white/10",
											"focus:outline-none",
											"disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-white/5"
										)}
										onFocus={handleFocus}
										onBlur={handleBlur}
										{...props}>
										<span
											className={cn("truncate", !value && "text-transparent")}>
											{value
												? value.toLocaleDateString("en-GB")
												: label || "Select date"}
										</span>
										<CalendarIcon className="ml-auto size-4 opacity-50" />
									</button>
								</PopoverTrigger>

								{label && (
									<label
										className={cn(
											"absolute left-4 transition-all duration-200 pointer-events-none font-light font-nunito z-10",
											isActiveWithFocus
												? "top-1.5 text-xs text-white/60"
												: "top-4 text-base text-white/40",
											error && isActiveWithFocus && "text-red-400"
										)}>
										{label}
									</label>
								)}
							</>
						)
					}}
				</InputWrapper>

				<PopoverContent
					className="w-auto overflow-hidden p-0 bg-white/10 backdrop-blur-xl border border-white/20 text-white"
					align="start">
					<CalendarComponent
						mode="single"
						selected={value}
						defaultMonth={value}
						captionLayout="dropdown"
						onSelect={(date) => {
							onChange?.(date)
							setOpen(false)
						}}
					/>
				</PopoverContent>
			</Popover>

			{(error || helperText) && (
				<p
					className={cn(
						"mt-1.5 px-4 text-xs font-light font-nunito",
						error ? "text-red-400" : "text-white/40"
					)}>
					{error || helperText}
				</p>
			)}
		</div>
	)
}
