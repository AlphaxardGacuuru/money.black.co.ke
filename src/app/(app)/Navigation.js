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

const Navigation = ({ user }) => {
	const { logout } = useAuth()

	const [open, setOpen] = useState(false)

	return (
		<nav className="bg-white/5 backdrop-blur-xl border-b border-white/10 relative z-50">
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
							{/* Dashboard Start */}
							<NavLink
								href="/dashboard"
								active={usePathname() === "/dashboard"}>
								Dashboard
							</NavLink>
							{/* Dashboard End */}

							{/* Clients Start */}
							<NavLink
								href="/clients"
								active={usePathname().startsWith("/clients")}>
								Clients
							</NavLink>
							{/* Clients End */}

							{/* Invoices Start */}
							<NavLink
								href="/invoices"
								active={usePathname().startsWith("/invoices")}>
								Invoices
							</NavLink>
							{/* Invoices End */}

							{/* Payments Start */}
							<NavLink
								href="/payments"
								active={usePathname().startsWith("/payments")}>
								Payments
							</NavLink>
							{/* Payments End */}

							{/* Credit Notes Start */}
							<NavLink
								href="/credit-notes"
								active={usePathname().startsWith("/credit-notes")}>
								Credit Notes
							</NavLink>
							{/* Credit Notes End */}

							{/* Deductions Start */}
							<NavLink
								href="/deductions"
								active={usePathname().startsWith("/deductions")}>
								Deductions
							</NavLink>
							{/* Deductions End */}
						</div>
					</div>

					{/* Settings Dropdown */}
					<div className="hidden sm:flex sm:items-center sm:ml-6">
						<Dropdown
							align="right"
							width="48"
							trigger={
								<button className="flex items-center text-sm font-medium text-white hover:text-white/80 focus:outline-none transition duration-150 ease-in-out">
									<div>{user?.name}</div>

									<div className="ml-1">
										<ChevronDownSVG />
									</div>
								</button>
							}>
							{/* Authentication */}
							<DropdownButton onClick={logout}>Logout</DropdownButton>
						</Dropdown>
					</div>

					{/* Hamburger */}
					<div className="-mr-2 flex items-center sm:hidden">
						<button
							onClick={() => setOpen((open) => !open)}
							className="inline-flex items-center justify-center p-2 rounded-md text-white/80 hover:text-white hover:bg-white/10 focus:outline-none focus:bg-white/10 focus:text-white transition duration-150 ease-in-out">
							<svg
								className="h-6 w-6"
								stroke="currentColor"
								fill="none"
								viewBox="0 0 24 24">
								{open ? (
									<path
										className="inline-flex"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M6 18L18 6M6 6l12 12"
									/>
								) : (
									<path
										className="inline-flex"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M4 6h16M4 12h16M4 18h16"
									/>
								)}
							</svg>
						</button>
					</div>
				</div>
			</div>

			{/* Responsive Navigation Menu */}
			{open && (
				<div className="block sm:hidden bg-white/5 backdrop-blur-xl">
					<div className="pt-2 pb-3 space-y-1">
						<ResponsiveNavLink
							href="/dashboard"
							active={usePathname() === "/dashboard"}>
							Dashboard
						</ResponsiveNavLink>
					</div>

					{/* Responsive Settings Options */}
					<div className="pt-4 pb-1 border-t border-white/10">
						<div className="flex items-center px-4">
							<div className="flex-shrink-0">
								<svg
									className="h-10 w-10 fill-current text-white/50"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
									/>
								</svg>
							</div>

							<div className="ml-3">
								<div className="font-medium text-base text-white">
									{user?.name}
								</div>
								<div className="font-medium text-sm text-white/60">
									{user?.email}
								</div>
							</div>
						</div>

						<div className="mt-3 space-y-1">
							{/* Authentication */}
							<ResponsiveNavButton onClick={logout}>Logout</ResponsiveNavButton>
						</div>
					</div>
				</div>
			)}
		</nav>
	)
}

export default Navigation
