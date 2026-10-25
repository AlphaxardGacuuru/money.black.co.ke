import { Activity, ChevronDown, Layers, ShieldCheck } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { useApp } from "@/contexts/AppContext"

/**
 * Links to the server-rendered admin dashboards. Shown only to users the
 * viewTelescope / viewHorizon gates allow (reported by /api/auth).
 */
export function NavAdmin() {
	const { auth } = useApp()

	const items = [
		auth?.can_view_telescope && { title: "Telescope", href: "/telescope", icon: Activity },
		auth?.can_view_horizon && { title: "Horizon", href: "/horizon", icon: Layers },
	].filter((item): item is { title: string; href: string; icon: typeof Activity } => Boolean(item))

	if (items.length === 0) {
		return null
	}

	return (
		<SidebarGroup className="group-data-[collapsible=icon]:p-0">
			<SidebarGroupContent>
				<SidebarMenu>
					<Collapsible className="group/admin">
						<SidebarMenuItem>
							<CollapsibleTrigger asChild>
								<SidebarMenuButton
									tooltip={{ children: "Admin" }}
									className="justify-end text-right text-neutral-600 group-data-[collapsible=icon]:justify-center hover:text-neutral-800 dark:text-neutral-300 dark:hover:text-neutral-100">
									<ChevronDown className="size-4 transition-transform group-data-[state=open]/admin:rotate-180" />
									<span>Admin</span>
									<ShieldCheck className="h-5 w-5" />
								</SidebarMenuButton>
							</CollapsibleTrigger>

							<CollapsibleContent>
								<SidebarMenuSub className="mr-3.5 ml-0 border-r border-l-0 pr-2.5 pl-0">
									{items.map((item) => (
										<SidebarMenuSubItem key={item.title}>
											{/* Full page loads: these dashboards are served by Laravel, not the SPA. */}
											<SidebarMenuSubButton
												href={item.href}
												target="_blank"
												rel="noopener"
												className="justify-end">
												<span>{item.title}</span>
												<item.icon />
											</SidebarMenuSubButton>
										</SidebarMenuSubItem>
									))}
								</SidebarMenuSub>
							</CollapsibleContent>
						</SidebarMenuItem>
					</Collapsible>
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	)
}
