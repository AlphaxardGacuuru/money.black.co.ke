import AppLogoIcon from "@/components/app-logo-icon"
import { cn } from "@/lib/utils"

type AppLogoProps = {
	className?: string
	iconClassName?: string
	textClassName?: string
	variant?: "full" | "icon"
	text?: string
}

export default function AppLogo({ className, iconClassName }: AppLogoProps) {
	return (
		<div
			className={cn(
				"inline-flex items-center gap-3 text-foreground",
				className
			)}>
			<AppLogoIcon className={cn("h-9 w-9 shrink-0", iconClassName)} />
		</div>
	)
}
