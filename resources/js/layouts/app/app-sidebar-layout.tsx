import { AppContent } from "@/components/app-content"
import { AppShell } from "@/components/app-shell"
import { AppSidebar } from "@/components/app-sidebar"
import { AppSidebarHeader } from "@/components/app-sidebar-header"
import type { AppLayoutProps } from "@/types"
import { AppBottomNav } from "@/components/app-bottom-nav"

export default function AppSidebarLayout({
	children,
	breadcrumbs = [],
}: AppLayoutProps) {
	return (
		<AppShell variant="sidebar">
			<AppContent
				variant="sidebar"
				className="pb-24 md:pb-0">
				<AppSidebarHeader breadcrumbs={breadcrumbs} />
				<div className="flex flex-1 flex-col overflow-x-hidden">{children}</div>
			</AppContent>
			<AppSidebar />
			<AppBottomNav />
		</AppShell>
	)
}
