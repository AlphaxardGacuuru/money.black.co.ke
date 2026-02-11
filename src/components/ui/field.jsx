import * as React from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const Field = React.forwardRef(({ className, orientation = "vertical", ...props }, ref) => {
	return (
		<div
			ref={ref}
			className={cn(
				"flex",
				orientation === "horizontal" ? "flex-row items-center gap-2" : "flex-col gap-2",
				className
			)}
			{...props}
		/>
	)
})
Field.displayName = "Field"

const FieldGroup = React.forwardRef(({ className, ...props }, ref) => {
	return (
		<div
			ref={ref}
			className={cn("space-y-4", className)}
			{...props}
		/>
	)
})
FieldGroup.displayName = "FieldGroup"

const FieldLabel = React.forwardRef(({ className, ...props }, ref) => {
	return <Label ref={ref} className={cn(className)} {...props} />
})
FieldLabel.displayName = "FieldLabel"

export { Field, FieldGroup, FieldLabel }
