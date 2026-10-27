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
									tooltip={{ children: "Admin" }}>
									<ShieldCheck className="h-5 w-5" />
									<span>Admin</span>
									<ChevronDown className="ms-auto size-4 transition-transform group-data-[state=open]/admin:rotate-180" />
								</SidebarMenuButton>
							</CollapsibleTrigger>

							<CollapsibleContent>
								<SidebarMenuSub>
									{items.map((item) => (
										<SidebarMenuSubItem key={item.title}>
											{/* Full page loads: these dashboards are served by Laravel, not the SPA. */}
											<SidebarMenuSubButton
												href={item.href}
												target="_blank"
												rel="noopener"
												className="justify-start">
												<item.icon />
												<span>{item.title}</span>
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
