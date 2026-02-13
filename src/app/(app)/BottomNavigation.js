import ApplicationLogo from "@/components/ApplicationLogo"
import Dropdown from "@/components/Dropdown"
import Link from "next/link"
import NavLink from "@/components/NavLink"
import ResponsiveNavLink, {
	ResponsiveNavButton,
} from "@/components/ResponsiveNavLink"
import { DropdownButton } from "@/components/DropdownLink"
import { useAuth } from "@/hooks/auth"
import { usePathname } from "next/navigation"
import { useState } from "react"
import ChevronDownSVG from "@/svgs/ChevronDownSVG"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { WalletSVG } from "@/svgs"
import CategoriesSVG from "@/svgs/CategoriesSVG"
import TransactionsSVG from "@/svgs/TransactionsSVG"
import OverviewSVG from "@/svgs/OverviewSVG"

const BottomNavigation = () => {
	return (
		<nav className="w-full bg-white/5 backdrop-blur-xl border-b border-white/10 fixed bottom-0 z-50">
			{/* Navigation Links */}
			<div className="flex justify-between h-16 mx-4">
				{/* Accounts Start */}
				<NavLink
					href="/accounts"
					icon={<WalletSVG />}
					active={usePathname() === "/accounts"}>
					Accounts
				</NavLink>
				{/* Accounts End */}

				{/* Categories Start */}
				<NavLink
					href="/categories"
					icon={<CategoriesSVG />}
					active={usePathname().startsWith("/categories")}>
					Categories
				</NavLink>
				{/* Categories End */}

				{/* Transactions Start */}
				<NavLink
					href="/transactions"
					icon={<TransactionsSVG />}
					active={usePathname().startsWith("/transactions")}>
					Transactions
				</NavLink>
				{/* Transactions End */}

				{/* Overview Start */}
				<NavLink
					href="/overview"
					icon={<OverviewSVG />}
					active={usePathname().startsWith("/overview")}>
					Overview
				</NavLink>
				{/* Overview End */}
			</div>
		</nav>
	)
}

export default BottomNavigation
