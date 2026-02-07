import React from "react"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"

/**
 * Reusable Modal Component
 * @param {boolean} open - Controls modal visibility
 * @param {function} onOpenChange - Callback when modal open state changes
 * @param {string} title - Modal title
 * @param {string} description - Modal description (optional)
 * @param {React.ReactNode} children - Modal content
 * @param {React.ReactNode} footer - Modal footer content (buttons, etc.)
 * @param {string} className - Additional classes for DialogContent
 */
export const Modal = ({
	open,
	onOpenChange,
	title,
	description,
	children,
	footer,
	className = "",
}) => {
	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}>
			<DialogContent className={className}>
				{(title || description) && (
					<DialogHeader>
						{title && <DialogTitle>{title}</DialogTitle>}
						{description && <DialogDescription>{description}</DialogDescription>}
					</DialogHeader>
				)}
				{children}
				{footer && <DialogFooter>{footer}</DialogFooter>}
			</DialogContent>
		</Dialog>
	)
}

export default Modal
