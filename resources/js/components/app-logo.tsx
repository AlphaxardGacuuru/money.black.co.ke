import AppLogoIcon from "@/components/app-logo-icon"

type AppLogoProps = {
	variant?: "lockup" | "full"
	className?: string
}

export default function AppLogo({
	variant = "lockup",
	className,
}: AppLogoProps) {
	if (variant === "full") {
		return (
			<img
				src="/default-monochrome-black.svg"
				alt="Black Money Logo"
				className={className ?? "h-5 w-auto dark:invert"}
			/>
		)
	}

	return (
		<>
			<div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
				<AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
			</div>
			<div className="ml-1 grid flex-1 text-left text-sm">
				<span className="mb-0.5 truncate leading-tight font-semibold">
					Black Money
				</span>
			</div>
		</>
	)
}
