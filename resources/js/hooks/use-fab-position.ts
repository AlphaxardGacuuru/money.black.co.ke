import type { CSSProperties } from "react"
import { useSidebar } from "@/components/ui/sidebar"

/**
 * Positions a floating action button: above the bottom nav on phones, and
 * clear of the right-hand sidebar (expanded or collapsed) on desktop. Spread
 * the result onto the wrapper element.
 */
export function useFabPosition(): { className: string; style: CSSProperties } {
	const { state } = useSidebar()

	const desktopRightOffset =
		state === "collapsed"
			? "calc(var(--sidebar-width-icon) + 2rem)"
			: "calc(var(--sidebar-width) + 2rem)"

	return {
		className: "fixed right-4 bottom-26 z-30 md:right-(--fab-right-offset) md:bottom-6",
		style: { "--fab-right-offset": desktopRightOffset } as CSSProperties,
	}
}
