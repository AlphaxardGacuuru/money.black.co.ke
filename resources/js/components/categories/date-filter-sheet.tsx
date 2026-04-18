import { format } from "date-fns"
import {
	Calendar1Icon,
	CalendarArrowUpIcon,
	CalendarCheckIcon,
	CalendarClockIcon,
	CalendarDaysIcon,
	CalendarRangeIcon,
	CalendarX2Icon,
	ChevronDownIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useState } from "react"
import { DatePicker } from "@/components/ui/date-picker"
import { Button } from "@/components/ui/button"
import { useApp } from "@/contexts/AppContext"
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import type { DateFilterParams, DateFilterType } from "@/types/date-filter"

type FilterOption = {
	value: DateFilterType
	label: string
	icon: LucideIcon
}

const FILTER_OPTIONS: FilterOption[] = [
	{ value: "all_time", label: "All Time", icon: CalendarX2Icon },
	{ value: "today", label: "Today", icon: CalendarCheckIcon },
	{ value: "week", label: "Week", icon: CalendarDaysIcon },
	{ value: "month", label: "Month", icon: CalendarClockIcon },
	{ value: "year", label: "Year", icon: CalendarArrowUpIcon },
	{ value: "date", label: "Date", icon: Calendar1Icon },
	{ value: "dateRange", label: "Date Range", icon: CalendarRangeIcon },
]

function parseDateInput(value?: string): Date | null {
	if (!value) {
		return null
	}

	const [year, month, day] = value.split("-").map(Number)

	if (!year || !month || !day) {
		return null
	}

	return new Date(year, month - 1, day)
}

function getFilterDateDetail(filters: DateFilterParams): string | null {
	const activeFilter = filters.filter ?? "all_time"
	const now = new Date()

	switch (activeFilter) {
		case "today":
			return format(now, "EEE, dd MMM yyyy")
		case "week": {
			const start = new Date(now)
			const dayOffset = (start.getDay() + 6) % 7
			start.setDate(start.getDate() - dayOffset)

			const end = new Date(start)
			end.setDate(start.getDate() + 6)

			return `${format(start, "EEE, dd")} - ${format(end, "EEE, dd MMM yyyy")}`
		}
		case "month": {
			const start = new Date(now.getFullYear(), now.getMonth(), 1)
			// const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)

			return `${format(start, "MMM yyyy")}`
		}
		case "year": {
			const start = new Date(now.getFullYear(), 0, 1)
			// const end = new Date(now.getFullYear(), 11, 31)

			return `${format(start, "yyyy")}`
		}
		case "date": {
			const resolvedDate = parseDateInput(filters.date)

			return resolvedDate ? format(resolvedDate, "EEE, dd MMM yyyy") : null
		}
		case "dateRange": {
			const start = parseDateInput(filters.startDate)
			const end = parseDateInput(filters.endDate)

			if (start && end) {
				return `${format(start, "EEE, dd MMM yyyy")} - ${format(end, "EEE, dd MMM yyyy")}`
			}

			if (start) {
				return `From ${format(start, "EEE, dd MMM yyyy")}`
			}

			if (end) {
				return `Until ${format(end, "EEE, dd MMM yyyy")}`
			}

			return null
		}
		default:
			return null
	}
}

function getFilterLabel(filters: DateFilterParams): string {
	const dateDetail = getFilterDateDetail(filters)

	const option = FILTER_OPTIONS.find(
		(option) => option.value === (filters.filter ?? "all_time")
	)

	if (!dateDetail) {
		return option?.label ?? "All Time"
	}

	// return `${option?.label ?? "All Time"}: ${dateDetail}`
	return dateDetail
}

export default function DateFilterSheet() {
	const { dateFilters, setDateFilters } = useApp()
	const [open, setOpen] = useState(false)
	const filters = dateFilters
	const selected = filters.filter ?? "all_time"
	const date = filters.date ?? ""
	const startDate = filters.startDate ?? ""
	const endDate = filters.endDate ?? ""

	function applyFilter(
		filter: DateFilterType,
		overrides: Partial<DateFilterParams> = {}
	) {
		setDateFilters({
			...filters,
			filter,
			date: overrides.date ?? date,
			startDate: overrides.startDate ?? startDate,
			endDate: overrides.endDate ?? endDate,
		})
		setOpen(false)
	}

	function handleOptionClick(value: DateFilterType) {
		if (value !== "date" && value !== "dateRange") {
			applyFilter(value)

			return
		}

		setDateFilters((current) => ({
			...current,
			filter: value,
		}))
	}

	const isActive = selected !== "all_time" && selected !== "today"

	return (
		<Sheet
			open={open}
			onOpenChange={setOpen}>
			<div className="flex w-full items-center justify-between gap-2 rounded-3xl border border-sidebar-border bg-sidebar p-1 text-sidebar-foreground backdrop-blur supports-backdrop-filter:bg-sidebar/95">
				{/* Previous Start */}
				<Button
					variant="secondary"
					size="sm"
					className="rounded-3xl">
					<ChevronLeftIcon />
				</Button>
				{/* Previous End */}

				<SheetTrigger asChild className="">
					{/* Date Filter Start */}
					<Button
						variant={isActive ? "default" : "outline"}
						size="sm"
						className="gap-1.5 rounded-3xl">
						{getFilterLabel(filters)}
						<ChevronDownIcon className="size-3.5 opacity-60" />
					</Button>
					{/* Date Filter End */}
				</SheetTrigger>
				{/* Next Start */}
				<Button
					variant="secondary"
					size="sm"
					className="rounded-3xl">
					<ChevronRightIcon />
				</Button>
				{/* Next End */}
			</div>

			<SheetContent
				side="bottom"
				className="rounded-t-3xl border-sidebar-border bg-sidebar text-sidebar-foreground backdrop-blur supports-backdrop-filter:bg-sidebar/95 [&>button]:top-1 [&>button]:right-0 [&>button]:left-auto [&>button]:size-11 [&>button>svg]:size-6">
				<SheetHeader>
					<SheetTitle>Filter by Date</SheetTitle>
				</SheetHeader>

				<div className="grid grid-cols-2 gap-2 px-4">
					{FILTER_OPTIONS.map((option) =>
						(() => {
							const Icon = option.icon

							return (
								<button
									key={option.value}
									onClick={() => handleOptionClick(option.value)}
									className={cn(
										"flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border px-3 py-4 text-center text-sm font-medium transition-colors hover:bg-muted",
										option.value === "all_time" && "col-span-2",
										selected === option.value && "bg-muted"
									)}>
									<Icon className="size-5" />
									{option.label}
								</button>
							)
						})()
					)}
				</div>

				<div className="px-4 pb-6">
					{selected === "date" && (
						<div className="mt-3 space-y-3 px-1">
							<DatePicker
								label="Date"
								value={date}
								onChange={(value) =>
									setDateFilters((current) => ({
										...current,
										date: value,
									}))
								}
							/>
							<Button
								className="w-full"
								onClick={() => applyFilter("date")}
								disabled={!date}>
								Apply
							</Button>
						</div>
					)}

					{selected === "dateRange" && (
						<div className="mt-3 space-y-3 px-1">
							<DatePicker
								label="Start Date"
								value={startDate}
								onChange={(value) =>
									setDateFilters((current) => ({
										...current,
										startDate: value,
									}))
								}
							/>
							<DatePicker
								label="End Date"
								value={endDate}
								onChange={(value) =>
									setDateFilters((current) => ({
										...current,
										endDate: value,
									}))
								}
							/>
							<Button
								className="w-full"
								onClick={() => applyFilter("dateRange")}
								disabled={!startDate || !endDate}>
								Apply
							</Button>
						</div>
					)}
				</div>
			</SheetContent>
		</Sheet>
	)
}
