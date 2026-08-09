import { useRef, useState } from "react"
import { useApp } from "@/contexts/AppContext"
import { canShiftDateFilter, shiftDateFilter } from "@/lib/date-filter"
import { cn } from "@/lib/utils"

type Props = {
	children: React.ReactNode
	className?: string
}

const SWIPE_THRESHOLD = 50
const DRAG_DAMPING = 0.4

/**
 * Wraps date-filtered page content so a horizontal swipe moves to the
 * previous/next period (day/week/month/year) for the active date filter,
 * mirroring the chevron buttons in DateFilterSheet.
 */
export default function SwipeableDateView({ children, className }: Props) {
	const { dateFilters, setDateFilters } = useApp()
	const touchStartXRef = useRef<number | null>(null)
	const touchStartYRef = useRef<number | null>(null)
	const [dragX, setDragX] = useState(0)
	const [isDragging, setIsDragging] = useState(false)

	const canShift = canShiftDateFilter(dateFilters)

	function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
		if (!canShift) {
			return
		}

		const touch = event.touches[0]

		touchStartXRef.current = touch?.clientX ?? null
		touchStartYRef.current = touch?.clientY ?? null
	}

	function handleTouchMove(event: React.TouchEvent<HTMLDivElement>) {
		const startX = touchStartXRef.current
		const startY = touchStartYRef.current
		const touch = event.touches[0]

		if (!canShift || startX === null || startY === null || !touch) {
			return
		}

		const deltaX = touch.clientX - startX
		const deltaY = touch.clientY - startY

		if (Math.abs(deltaX) <= Math.abs(deltaY)) {
			return
		}

		setIsDragging(true)
		setDragX(deltaX * DRAG_DAMPING)
	}

	function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
		const startX = touchStartXRef.current
		const startY = touchStartYRef.current
		const touch = event.changedTouches[0]

		touchStartXRef.current = null
		touchStartYRef.current = null
		setIsDragging(false)
		setDragX(0)

		if (!canShift || !touch || startX === null || startY === null) {
			return
		}

		const deltaX = touch.clientX - startX
		const deltaY = touch.clientY - startY

		if (
			Math.abs(deltaX) < SWIPE_THRESHOLD ||
			Math.abs(deltaX) <= Math.abs(deltaY)
		) {
			return
		}

		setDateFilters((current) => shiftDateFilter(current, deltaX < 0 ? 1 : -1))
	}

	function handleTouchCancel() {
		touchStartXRef.current = null
		touchStartYRef.current = null
		setIsDragging(false)
		setDragX(0)
	}

	return (
		<div
			className={cn("touch-pan-y", className)}
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
			onTouchCancel={handleTouchCancel}
			style={{
				transform: dragX ? `translateX(${dragX}px)` : undefined,
				transition: isDragging ? "none" : "transform 150ms ease-out",
			}}>
			{children}
		</div>
	)
}
