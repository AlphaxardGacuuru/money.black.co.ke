import Link from "next/link"

const NavLink = ({ active = false, children, ...props }) => (
	<Link
		{...props}
		className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium leading-5 focus:outline-none transition duration-150 ease-in-out ${
			active
				? "border-white/60 text-white focus:border-white/80"
				: "border-transparent text-white/60 hover:text-white/80 hover:border-white/30 focus:text-white/80 focus:border-white/30"
		}`}>
		{children}
	</Link>
)

export default NavLink
