import { useApp } from "@/contexts/AppContext"
import type { ReactNode } from "react"
import { FloatingUserAvatar } from "@/components/floating-user-avatar"
import { SidebarProvider } from "@/components/ui/sidebar"
import type { AppVariant } from "@/types"

type Props = {
	children: ReactNode
	variant?: AppVariant
}

export function AppShell({ children, variant = "sidebar" }: Props) {
	const { auth } = useApp()

	const shouldRenderFloatingAvatar = Boolean(auth)

	if (variant === "header") {
		return (
			<div className="flex min-h-screen w-full flex-col bg-primary/20 dark:bg-primary/10">
				{children}
				{shouldRenderFloatingAvatar && <FloatingUserAvatar />}
			</div>
		)
	}

	return (
		// <div className="bg-background">
		<div className="">
			<SidebarProvider defaultOpen={true}>
				{children}
				{/* {shouldRenderFloatingAvatar && <FloatingUserAvatar />} */}
			</SidebarProvider>
		</div>
	)
}
