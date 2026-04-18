import * as React from "react"
import { useState, forwardRef } from "react"
import { cn } from "@/lib/utils"

type InputWrapperRenderProps = {
	focused: boolean
	handleFocus: React.FocusEventHandler<HTMLElement>
	handleBlur: React.FocusEventHandler<HTMLElement>
}

type InputWrapperProps = Omit<React.HTMLAttributes<HTMLDivElement>, "children"> & {
	children:
		| React.ReactNode
		| ((props: InputWrapperRenderProps) => React.ReactNode)
	error?: string | boolean
	showBorder?: boolean
}

const InputWrapper = forwardRef<HTMLDivElement, InputWrapperProps>(
	({ className, children, error, showBorder = true, ...props }, ref) => {
		const [focused, setFocused] = useState(false)
		const [shimmerDirection, setShimmerDirection] = useState<
			"clockwise" | "counterclockwise"
		>("clockwise")

		const handleFocus: React.FocusEventHandler<HTMLElement> = () => {
			setFocused(true)
			setShimmerDirection("clockwise")
		}

		const handleBlur: React.FocusEventHandler<HTMLElement> = () => {
			setFocused(false)
			setShimmerDirection("counterclockwise")
		}

		return (
			<div
				className={cn("relative", className)}
				ref={ref}
				{...props}>
				{/* Shimmer border effect */}
				{showBorder &&
					(focused || shimmerDirection === "counterclockwise") &&
					!error && (
						<div className="absolute -inset-0.5 rounded-lg overflow-hidden">
							<div
								key={shimmerDirection}
								className="absolute inset-0"
								style={{
									background: `conic-gradient(from ${shimmerDirection === "clockwise" ? "0deg" : "360deg"}, 
                                        transparent 0deg, 
                                        rgba(255, 255, 255, 0.1) 60deg,
                                        rgba(255, 255, 255, 0.8) 90deg, 
                                        rgba(255, 255, 255, 0.1) 120deg,
                                        transparent 180deg)`,
									animation: `shimmer-${shimmerDirection} 0.8s ease-out forwards`,
								}}
							/>
							<div className="absolute inset-0.5 rounded-lg bg-[#0a0a0a]" />
						</div>
					)}

				{typeof children === "function"
					? children({ focused, handleFocus, handleBlur })
					: children}

				<style
					dangerouslySetInnerHTML={{
						__html: `
                    @keyframes shimmer-clockwise {
                        from {
                            transform: rotate(0deg);
                        }
                        to {
                            transform: rotate(360deg);
                        }
                    }
                    
                    @keyframes shimmer-counterclockwise {
                        from {
                            transform: rotate(360deg);
                        }
                        to {
                            transform: rotate(0deg);
                        }
                    }
                `,
					}}
				/>
			</div>
		)
	}
)

InputWrapper.displayName = "InputWrapper"

export { InputWrapper }
