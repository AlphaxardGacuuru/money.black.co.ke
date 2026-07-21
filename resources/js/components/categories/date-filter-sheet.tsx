import {
	addDays,
	addMonths,
	addYears,
	differenceInCalendarDays,
	format,
	startOfMonth,
	startOfYear,
	startOfWeek,
} from "date-fns"
import {
	formatDateInput,
	getTodayDateFilter,
	getTodayDateInput,
	isDateFilterAtToday,
	parseDateInput,
} from "@/lib/date-filter"
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
import { useRef, useState } from "react"
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

function getFilterDateDetail(filters: DateFilterParams): string | null {
	const activeFilter = filters.filter ?? "all_time"
	const referenceDate = parseDateInput(filters.date) ?? new Date()

	switch (activeFilter) {
		case "today":
			return format(referenceDate, "EEE, dd MMM yyyy")
		case "week": {
			const start = startOfWeek(referenceDate, { weekStartsOn: 1 })
			const end = new Date(start)
			end.setDate(start.getDate() + 6)

			return `${format(start, "EEE, dd")} - ${format(end, "EEE, dd MMM yyyy")}`
		}
		case "month": {
			const start = startOfMonth(referenceDate)

			return `${format(start, "MMM yyyy")}`
		}
		case "year": {
			const start = startOfYear(referenceDate)

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
	const swipeStartXRef = useRef<number | null>(null)
	const swipeStartYRef = useRef<number | null>(null)
	const filters = dateFilters
	const selected = filters.filter ?? "all_time"
	const date = filters.date ?? ""
	const startDate = filters.startDate ?? ""
	const endDate = filters.endDate ?? ""
	const swipeThreshold = 40

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
			applyFilter(value, value === "today" ? { date: getTodayDateInput() } : {})

			return
		}

		setDateFilters((current) => getTodayDateFilter({ ...current, filter: value }))
	}

	function handleShift(direction: -1 | 1) {
		if (selected === "all_time") {
			return
		}

		if (selected === "dateRange") {
			const currentStart = parseDateInput(startDate) ?? new Date()
			const currentEnd = parseDateInput(endDate) ?? currentStart
			const spanDays = Math.max(
				1,
				differenceInCalendarDays(currentEnd, currentStart) + 1
			)
			const offset = direction * spanDays
			const nextStart = addDays(currentStart, offset)
			const nextEnd = addDays(currentEnd, offset)

			setDateFilters({
				...filters,
				startDate: formatDateInput(nextStart),
				endDate: formatDateInput(nextEnd),
			})

			return
		}

		const currentReferenceDate = parseDateInput(date) ?? new Date()
		const nextDate =
			selected === "week"
				? addDays(currentReferenceDate, direction * 7)
				: selected === "month"
					? addMonths(currentReferenceDate, direction)
					: selected === "year"
						? addYears(currentReferenceDate, direction)
						: addDays(currentReferenceDate, direction)

		setDateFilters({
			...filters,
			date: formatDateInput(nextDate),
		})
	}

	function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
		const touch = event.touches[0]

		swipeStartXRef.current = touch?.clientX ?? null
		swipeStartYRef.current = touch?.clientY ?? null
	}

	function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
		const startX = swipeStartXRef.current
		const startY = swipeStartYRef.current
		const touch = event.changedTouches[0]

		swipeStartXRef.current = null
		swipeStartYRef.current = null

		if (!touch || startX === null || startY === null) {
			return
		}

		const deltaX = touch.clientX - startX
		const deltaY = touch.clientY - startY

		if (Math.abs(deltaX) < swipeThreshold) {
			return
		}

		if (Math.abs(deltaX) <= Math.abs(deltaY)) {
			return
		}

		handleShift(deltaX < 0 ? 1 : -1)
	}

	const isActive = selected !== "all_time" && !isDateFilterAtToday(filters)

	return (
		<Sheet
			open={open}
			onOpenChange={setOpen}>
			<div
				className="flex w-full items-center justify-between gap-1 mb-2 text-sidebar-foreground"
				onTouchStart={handleTouchStart}
				onTouchEnd={handleTouchEnd}>
				{/* Previous Start */}
				<Button
					variant="secondary"
					size="lg"
					onClick={() => handleShift(-1)}
					disabled={selected === "all_time"}
					className="rounded-3xl px-4 py-2">
					<ChevronLeftIcon />
				</Button>
				{/* Previous End */}

				<SheetTrigger
					asChild
					className="w-full">
					{/* Date Filter Start */}
					<Button
						variant={isActive ? "default" : "outline"}
						size="lg"
						className="gap-2 rounded-3xl px-4 py-2 text-sm">
						{getFilterLabel(filters)}
						<ChevronDownIcon className="size-4 opacity-60" />
					</Button>
					{/* Date Filter End */}
				</SheetTrigger>
				{/* Next Start */}
				<Button
					variant="secondary"
					size="lg"
					onClick={() => handleShift(1)}
					disabled={selected === "all_time"}
					className="rounded-3xl px-4 py-2">
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
										"flex w-full flex-col items-center justify-center gap-2 rounded-xl border px-4 py-5 text-center text-base font-medium transition-colors hover:bg-muted",
										option.value === "all_time" && "col-span-2",
										selected === option.value && "bg-muted"
									)}>
									<Icon className="size-6" />
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
								className="h-11 w-full text-base"
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
								className="h-11 w-full text-base"
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
