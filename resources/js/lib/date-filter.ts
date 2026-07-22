import { format, isToday, isValid, parse } from "date-fns"
import type { DateFilterParams } from "@/types/date-filter"

export function parseDateInput(value?: string): Date | null {
	if (!value) {
		return null
	}

	const parsedDate = parse(value, "yyyy-MM-dd", new Date())

	if (!isValid(parsedDate)) {
		return null
	}

	return parsedDate
}

export function formatDateInput(value: Date): string {
	return format(value, "yyyy-MM-dd")
}

export function getTodayDateInput(): string {
	return formatDateInput(new Date())
}

export function isTodayDate(value?: string): boolean {
	return isToday(parseDateInput(value) ?? new Date())
}

export function isDateFilterAtToday(filters: DateFilterParams): boolean {
	const filter = filters.filter ?? "all_time"

	if (filter === "all_time") {
		return false
	}

	if (filter === "dateRange") {
		const startDate = parseDateInput(filters.startDate)
		const endDate = parseDateInput(filters.endDate)

		return Boolean(startDate && endDate && isToday(startDate) && isToday(endDate))
	}

	return isTodayDate(filters.date)
}

export function getTodayDateFilter(filters: DateFilterParams): DateFilterParams {
	const today = getTodayDateInput()
	const filter = filters.filter ?? "all_time"

	if (filter === "dateRange") {
		return {
			...filters,
			startDate: today,
			endDate: today,
		}
	}

	return {
		...filters,
		filter: filter === "all_time" ? "today" : filter,
		date: today,
	}
}

export function snapDateFilterToToday(filters: DateFilterParams): DateFilterParams {
	const filter = filters.filter ?? "all_time"

	if (
		filter !== "today" &&
		filter !== "week" &&
		filter !== "month" &&
		filter !== "year"
	) {
		return filters
	}

	const today = getTodayDateInput()

	if (filters.date === today) {
		return filters
	}

	return {
		...filters,
		date: today,
	}
}

/**
 * Converts DateFilterParams into a URL query string (e.g. "?filter=month").
 * Returns an empty string when no filter is active (all_time).
 */
export function buildFilterQuery(filters: DateFilterParams): string {
	const params = new URLSearchParams()

	const filter = filters.filter ?? "all_time"

	if (filter !== "all_time") {
		params.set("filter", filter)
	}

	if (
		(filter === "today" ||
			filter === "week" ||
			filter === "month" ||
			filter === "year" ||
			filter === "date") &&
		filters.date
	) {
		params.set("date", filters.date)
	}

	if (filter === "dateRange") {
		if (filters.startDate) {
			params.set("startDate", filters.startDate)
		}

		if (filters.endDate) {
			params.set("endDate", filters.endDate)
		}
	}

	const query = params.toString()

	return query ? `?${query}` : ""
}
