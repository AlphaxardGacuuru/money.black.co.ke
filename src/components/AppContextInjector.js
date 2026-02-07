"use client"

import { useApp } from "@/contexts/AppContext"
import { Children, cloneElement, isValidElement } from "react"
import Messages from "@/components/core/Messages"
import PageLoader from "@/components/core/PageLoader"

export default function AppContextInjector({ children }) {
	const appContext = useApp()

	// Clone children and inject app context as props
	const childrenWithProps = Children.map(children, (child) => {
		if (isValidElement(child)) {
			return cloneElement(child, appContext)
		}
		return child
	})

	return (
		<>
			<Messages
				messages={appContext.messages}
				setMessages={appContext.setMessages}
				errors={appContext.errors}
				setErrors={appContext.setErrors}
				setFormErrors={appContext.setFormErrors}
			/>
			<PageLoader loadingItems={appContext.loadingItems} />
			{childrenWithProps}
		</>
	)
}
