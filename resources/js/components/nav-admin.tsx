import { Activity, ChevronDown, Coins, Layers, ShieldCheck } from "lucide-react"
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible"
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
import { Link } from "@/components/ui/link"
import { useApp } from "@/contexts/AppContext"
import { useCurrentUrl } from "@/hooks/use-current-url"

/**
 * Admin pages: AI usage (an SPA page) and the server-rendered dashboards.
 * Each is shown only to users its gate allows (reported by /api/auth).
 */
export function NavAdmin() {
	const { auth } = useApp()

	const { isCurrentUrl } = useCurrentUrl()

	const items = [
		auth?.can_view_ai_usage && {
			title: "AI usage",
			href: "/admin/ai-usage",
			icon: Coins,
			internal: true,
		},
		auth?.can_view_telescope && {
			title: "Telescope",
			href: "/telescope",
			icon: Activity,
			internal: false,
		},
		auth?.can_view_horizon && {
			title: "Horizon",
			href: "/horizon",
			icon: Layers,
			internal: false,
		},
	].filter(
		(
			item
		): item is {
			title: string
			href: string
			icon: typeof Activity
			internal: boolean
		} => Boolean(item)
	)

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
								<SidebarMenuButton tooltip={{ children: "Admin" }}>
									<ShieldCheck className="h-5 w-5" />
									<span>Admin</span>
									<ChevronDown className="ms-auto size-4 transition-transform group-data-[state=open]/admin:rotate-180" />
								</SidebarMenuButton>
							</CollapsibleTrigger>

							<CollapsibleContent>
								<SidebarMenuSub>
									{items.map((item) => (
										<SidebarMenuSubItem key={item.title}>
											{item.internal ? (
												<SidebarMenuSubButton
													asChild
													isActive={isCurrentUrl(item.href)}
													className="justify-start">
													<Link href={item.href}>
														<item.icon />
														<span>{item.title}</span>
													</Link>
												</SidebarMenuSubButton>
											) : (
												/* Full page loads: these dashboards are served by Laravel, not the SPA. */
												<SidebarMenuSubButton
													href={item.href}
													target="_blank"
													rel="noopener"
													className="justify-start">
													<item.icon />
													<span>{item.title}</span>
												</SidebarMenuSubButton>
											)}
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
