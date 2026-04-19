import { Link } from "@inertiajs/react"
import {
	ArrowUpDown,
	ChartColumnIncreasing,
	FileSpreadsheet,
	Tags,
	Wallet,
} from "lucide-react"
import AppLogo from "@/components/app-logo"
import { NavFooter } from "@/components/nav-footer"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarTrigger,
} from "@/components/ui/sidebar"
import { dashboard } from "@/routes"
import type { NavItem } from "@/types"

export const mainNavItems: NavItem[] = [
	{
		title: "Accounts",
		href: "/accounts",
		icon: Wallet,
	},
	{
		title: "Categories",
		href: "/categories",
		icon: Tags,
	},
	{
		title: "Transactions",
		href: "/transactions",
		icon: ArrowUpDown,
	},
	{
		title: "Overview",
		href: "/overview",
		icon: ChartColumnIncreasing,
	}
]

const footerNavItems: NavItem[] = [
	{
		title: "Import 1Money",
		href: "/imports/one-money",
		icon: FileSpreadsheet,
	},
]

export function AppSidebar() {
	return (
		<Sidebar
			side="right"
			collapsible="icon"
			variant="inset">
			<SidebarHeader>
				<div className="flex items-center gap-2">
					<SidebarMenu className="min-w-0 flex-1">
						<SidebarMenuItem>
							<SidebarMenuButton
								size="lg"
								asChild>
								<Link
									href={dashboard()}
									prefetch>
									<AppLogo />
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
					<SidebarTrigger className="shrink-0" />
				</div>
			</SidebarHeader>

			<SidebarContent>
				<NavMain items={mainNavItems} />
			</SidebarContent>

			<SidebarFooter>
				<NavFooter
					items={footerNavItems}
					className="mt-auto"
				/>
				<NavUser />
			</SidebarFooter>
		</Sidebar>
	)
}
