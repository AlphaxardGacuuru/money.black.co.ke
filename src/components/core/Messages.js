import React, { useEffect, useState } from "react"
import { ToastContainer, toast, Bounce } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

const Messages = ({
	messages,
	setMessages,
	errors,
	setErrors,
	setFormErrors,
}) => {
	const [isMobile, setIsMobile] = useState(false)
	const [isSmallMobile, setIsSmallMobile] = useState(false)

	// Handle window resize and initial size
	useEffect(() => {
		// Set initial values
		const checkSize = () => {
			setIsMobile(window.innerWidth <= 768)
			setIsSmallMobile(window.innerWidth <= 480)
		}

		// Check size on mount
		checkSize()

		// Add resize listener
		window.addEventListener("resize", checkSize)
		return () => window.removeEventListener("resize", checkSize)
	}, [])

	useEffect(() => {
		// Display messages and errors as toasts
		if (messages.length > 0) {
			messages.forEach((message) => toast.success(message))
			setTimeout(() => setMessages([]), 2900)
		}

		if (errors.length > 0) {
			errors.forEach((validationErrors) => {
				// Check if validationErrors is an array
				if (Array.isArray(validationErrors)) {
					validationErrors.forEach((error) => toast.error(error))
				} else {
					toast.warning(validationErrors)
				}
			})
			setTimeout(() => setErrors([]), 2900)
			setTimeout(() => setFormErrors([]), 10000)
		}

		return () => {}
	}, [messages, errors])

	return (
		<ToastContainer
			position="top-right"
			autoClose={10000}
			hideProgressBar={false}
			newestOnTop={false}
			closeOnClick={true}
			rtl={false}
			pauseOnFocusLoss={true}
			draggable={true}
			draggablePercent={40}
			pauseOnHover={true}
			theme="colored"
			transition={Bounce}
			limit={undefined}
			closeButton={true}
			icon={true}
			enableMultiContainer={false}
			containerId={undefined}
			style={{
				zIndex: 1000002,
				fontSize: isSmallMobile ? "14px" : "16px",
				width: isSmallMobile ? "55%" : isMobile ? "50%" : "",
				left: isMobile ? "70%" : "",
				transform: isMobile ? "translateX(-50%)" : "",
				top: isMobile ? "10px" : "",
			}}
			toastStyle={{
				minHeight: isSmallMobile ? "50px" : "68px",
				fontSize: isSmallMobile ? "14px" : "16px",
				margin: isSmallMobile ? "4px 0" : "",
				// borderRadius: isSmallMobile ? "6px" : "",
				padding: isSmallMobile ? "8px 12px" : "",
			}}
		/>
	)
}

export default Messages
