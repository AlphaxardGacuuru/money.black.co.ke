"use client"

import { useAuth } from "@/hooks/auth"
import Link from "next/link"
import MyLink from "@/components/ui/my-link"

const LoginLinks = () => {
	const { user } = useAuth({ middleware: "guest" })

	return (
		<div className="hidden fixed top-0 right-0 px-6 py-4 sm:block z-10">
			{user ? (
				<MyLink
					href="/dashboard">
					Dashboard
				</MyLink>
			) : (
				<>
					<MyLink
						href="/login">
						Login
					</MyLink>

					<MyLink
						href="/register"
						className="ml-4">
						Register
					</MyLink>
				</>
			)}
		</div>
	)
}

export default LoginLinks
