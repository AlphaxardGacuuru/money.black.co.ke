import { Link } from "@inertiajs/react"
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar"
import { useCurrentUrl } from "@/hooks/use-current-url"
import type { NavItem } from "@/types"

export function NavMain({ items = [] }: { items: NavItem[] }) {
	const { isCurrentOrParentUrl } = useCurrentUrl()
	const { isMobile, setOpen, setOpenMobile } = useSidebar()

	function closeSidebar(): void {
		if (isMobile) {
			setOpenMobile(false)

			return
		}

		setOpen(false)
	}

	return (
		<SidebarGroup className="px-2 py-0">
			<SidebarGroupLabel className="hidden md:block">
				Platform
			</SidebarGroupLabel>
			<SidebarMenu className="hidden md:block">
				{items.map((item) => (
					<SidebarMenuItem
						key={item.title}
						className="hidden md:block">
						<SidebarMenuButton
							asChild
							isActive={isCurrentOrParentUrl(item.href)}
							tooltip={{ children: item.title }}>
							<Link
								href={item.href}
								onClick={closeSidebar}>
								{item.icon && <item.icon />}
								<span>{item.title}</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				))}
			</SidebarMenu>
		</SidebarGroup>
	)
}
