import * as React from "react"
import { cn } from "@/lib/utils"
import Link from "next/link"

const MyLink = React.forwardRef(
	(
		{
			href,
			linkStyle,
			className,
			icon,
			iconFront,
			text,
			variant = "default",
			size = "default",
			prefetch = true, // Enable prefetching by default for better navigation
			children,
			...props
		},
		ref
	) => {
		return (
			<Link
				href={href}
				style={linkStyle}
				prefetch={prefetch}
				className={cn(
					"p-1 px-5 min-h-[36px] rounded-3xl text-white border border-white/10 hover:bg-white/10 transition-all duration-700 ease-out group inline-flex items-center justify-center font-light font-nunito text-base capitalize",
					variant === "ghost" && "bg-transparent hover:bg-white/10",
					size === "sm" && "p-0.5 px-3",
					size === "lg" && "p-2 px-8",
					className
				)}
				ref={ref}
				{...props}>
				{/* Icon Start */}
				{icon && <span className="text-inherit">{icon}</span>}
				{/* Icon End */}

				{/* Text or Children */}
				{text ? (
					<span className="mx-2 text-inherit font-light font-nunito text-nowrap">
						{text}
					</span>
				) : (
					children
				)}
				{/* Text End */}

				{/* Icon Front Start */}
				{iconFront && <span className="text-inherit">{iconFront}</span>}
				{/* Icon Front End */}
			</Link>
		)
	}
)

export { MyLink }
export default MyLink
