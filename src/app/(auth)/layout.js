import Link from "next/link"
import AuthCard from "@/app/(auth)/AuthCard"
import ApplicationLogo from "@/components/ApplicationLogo"

export const metadata = {
	title: `${process.env.NEXT_PUBLIC_APP_NAME || "Black Developers"} - Login`,
}

const Layout = ({ children }) => {
	return (
		<AuthCard
			logo={
				<Link
					href="/"
					className="relative transform hover:scale-105 sm:hover:scale-110 transition-all duration-700 ease-out group cursor-pointer">
					<div className="w-48 sm:w-64 md:w-80 h-12 sm:h-16 md:h-20 flex items-center justify-center">
						<div className="text-white opacity-90 group-hover:opacity-100 transition-opacity duration-500">
							<ApplicationLogo />
						</div>
					</div>
				</Link>
			}>
			{children}
		</AuthCard>
	)
}

export default Layout
