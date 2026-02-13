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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Header from "@/app/(app)/Header"

import ChevronDownSVG from "@/svgs/ChevronDownSVG"

const Navigation = ({ user }) => {
	const { logout } = useAuth()

	const [open, setOpen] = useState(false)

	const getInitials = (name) => {
		if (!name) return "BN"
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.substring(0, 2)
	}

	return (
		<nav className="w-full bg-white/5 backdrop-blur-xl border-b border-white/10 fixed top-0 z-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between h-16">
					<div className="flex">
						{/* Logo */}
						<div className="flex-shrink-0 flex items-center">
							<Link href="/">
								<div className="text-white opacity-90 hover:opacity-100 transition-opacity duration-500">
									<ApplicationLogo className="block h-10 w-auto fill-current" />
								</div>
							</Link>
						</div>

						{/* Navigation Links */}
						<div className="hidden space-x-8 sm:-my-px sm:ml-10 sm:flex">
							{/* Accounts Start */}
							<NavLink
								href="/accounts"
								active={usePathname() === "/accounts"}>
								Accounts
							</NavLink>
							{/* Accounts End */}

							{/* Categories Start */}
							<NavLink
								href="/categories"
								active={usePathname().startsWith("/categories")}>
								Categories
							</NavLink>
							{/* Categories End */}

							{/* Transactions Start */}
							<NavLink
								href="/transactions"
								active={usePathname().startsWith("/transactions")}>
								Transactions
							</NavLink>
							{/* Transactions End */}

							{/* Overview Start */}
							<NavLink
								href="/overview"
								active={usePathname().startsWith("/overview")}>
								Overview
							</NavLink>
							{/* Overview End */}
						</div>
					</div>

					{/* Settings Dropdown */}
					<div className="flex-shrink-0 flex items-center">
						<Dropdown
							align="right"
							width="48"
							trigger={
								<button className="flex items-center text-sm font-medium text-white hover:text-white/80 focus:outline-none transition duration-150 ease-in-out">
									<Avatar className="h-8 w-8 mr-2">
										<AvatarImage src={user?.avatar} />
										<AvatarFallback className="bg-white text-white-100 font-bold">
											{getInitials(user?.name)}
										</AvatarFallback>
									</Avatar>
									<div className="hidden md:block">{user?.name}</div>

									<div className="ml-1 hidden md:block">
										<ChevronDownSVG />
									</div>
								</button>
							}>
							{/* Authentication */}
							<DropdownButton>{user?.name}</DropdownButton>
							<DropdownButton onClick={logout}>Logout</DropdownButton>
						</Dropdown>
					</div>
				</div>
			</div>
				{/* <Header title="Account" /> */}
		</nav>
	)
}

export default Navigation
