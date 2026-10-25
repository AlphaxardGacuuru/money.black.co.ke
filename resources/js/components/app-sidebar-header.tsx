import { Breadcrumbs } from "@/components/breadcrumbs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { useApp } from "@/contexts/AppContext"
import { useInitials } from "@/hooks/use-initials"
import { cn } from "@/lib/utils"
import type { BreadcrumbItem as BreadcrumbItemType } from "@/types"

/**
 * Opens the sidebar from the header using the user's avatar instead of a
 * hamburger icon. Falls back to the hamburger until the user has loaded.
 */
function SidebarAvatarTrigger() {
	const { auth } = useApp()
	const { toggleSidebar, isMobile, openMobile, state } = useSidebar()
	const getInitials = useInitials()

	if (!auth) {
		return <SidebarTrigger className="-ml-1" />
	}

	const isOpen = isMobile ? openMobile : state === "expanded"

	return (
		<button
			type="button"
			data-sidebar="trigger"
			onClick={toggleSidebar}
			aria-label={isOpen ? "Close menu" : "Open menu"}
			aria-expanded={isOpen}
			className="-ml-1 inline-flex shrink-0 items-center justify-center rounded-full transition-transform duration-200 hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-95">
			<Avatar className="size-8 overflow-hidden rounded-full border border-border/50">
				<AvatarImage
					src={auth.avatar}
					alt={auth.name}
				/>
				<AvatarFallback className="rounded-full bg-neutral-200 text-xs text-black dark:bg-neutral-700 dark:text-white">
					{getInitials(auth.name)}
				</AvatarFallback>
			</Avatar>
		</button>
	)
}

export function AppSidebarHeader({
	breadcrumbs = [],
	variant = "default",
}: {
	breadcrumbs?: BreadcrumbItemType[]
	variant?: "default" | "floating"
}) {
	return (
		<header
			className={cn(
				"sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 text-sidebar-foreground transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12",
				variant === "default" &&
					"border-b border-sidebar-border bg-sidebar px-6 md:px-4",
				variant === "floating" &&
					"mx-2 mt-2 rounded-xl border border-white/40 bg-white/34 px-4 shadow-[0_20px_45px_-28px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/12 dark:bg-slate-950/20"
			)}>
			<div className="min-w-0 flex-1">
				<Breadcrumbs breadcrumbs={breadcrumbs} />
			</div>
			<SidebarAvatarTrigger />
		</header>
	)
}
