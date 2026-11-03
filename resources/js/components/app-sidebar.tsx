import { Link } from "@inertiajs/react"
import {
	ArrowUpDown,
	Calculator,
	ChartColumnIncreasing,
	FileSpreadsheet,
	Lightbulb,
	ReceiptText,
	Tags,
	Wallet,
} from "lucide-react"
import AppLogo from "@/components/app-logo"
import { NavAdmin } from "@/components/nav-admin"
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
		title: "Receipts",
		href: "/receipts",
		icon: ReceiptText,
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
	},
]

/** Sidebar only: the bottom nav on phones has room for just the main items. */
const sidebarOnlyNavItems: NavItem[] = [
	{
		title: "Category ideas",
		href: "/category-suggestions",
		icon: Lightbulb,
	},
]

const footerNavItems: NavItem[] = [
	{
		title: "Calculator",
		href: "/tools",
		icon: Calculator,
	},
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
				<div className="mt-2 flex items-center gap-2">
					<SidebarMenu className="min-w-0 flex-1 items-center">
						<SidebarMenuItem>
							<SidebarMenuButton
								size="lg"
								asChild>
								<Link
									href="/accounts"
									prefetch>
									<AppLogo iconClassName="h-28 w-28 dark:invert" />
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
					<SidebarTrigger className="shrink-0" />
				</div>
			</SidebarHeader>

			<SidebarContent>
				<NavMain items={[...mainNavItems, ...sidebarOnlyNavItems]} />
				<NavAdmin />
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
