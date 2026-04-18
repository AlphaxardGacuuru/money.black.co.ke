import { Breadcrumbs } from "@/components/breadcrumbs"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import type { BreadcrumbItem as BreadcrumbItemType } from "@/types"

export function AppSidebarHeader({
	breadcrumbs = [],
}: {
	breadcrumbs?: BreadcrumbItemType[]
}) {
	return (
		<header
			className={cn(
				"sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border bg-sidebar px-6 text-sidebar-foreground backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 supports-backdrop-filter:bg-sidebar/95 md:px-4"
			)}>
			<div className="min-w-0 flex-1">
				<Breadcrumbs breadcrumbs={breadcrumbs} />
			</div>
			<SidebarTrigger className="-mr-1 md:group-has-data-[state=expanded]/sidebar-wrapper:hidden" />
		</header>
	)
}
