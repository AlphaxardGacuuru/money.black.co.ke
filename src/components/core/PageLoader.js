import React, { useState, useEffect } from "react"

import { ToastContainer, toast, Bounce } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

const PageLoader = (props) => {
	const [called, setCalled] = useState(false)
	const [isMobile, setIsMobile] = useState(
		typeof window !== "undefined" && window.innerWidth <= 768
	)
	const [isSmallMobile, setIsSmallMobile] = useState(
		typeof window !== "undefined" && window.innerWidth <= 480
	)

	const LoaderContent = (
		<div className="flex items-center justify-between gap-2">
			<div className="text-sm sm:text-base">Loading items</div>
			<Spinner className="size-5 text-white" />
		</div>
	)

	// Check if there are loading items and show toast
	useEffect(() => {
		if (props.loadingItems > 0) {
			if (!called) {
				toast.info(LoaderContent, {
					toastId: "page-loader-toast",
					position: "top-center",
					autoClose: false,
					hideProgressBar: false,
					newestOnTop: false,
					closeOnClick: false,
					rtl: false,
					pauseOnFocusLoss: true,
					draggable: false,
					draggablePercent: 40,
					pauseOnHover: true,
					theme: "colored",
					transition: Bounce,
					closeButton: false,
					stacked: false,
					className: cn(
						"text-sm sm:text-base",
						isMobile && "right-[30%]"
					),
					bodyClassName: cn(
						"min-h-[50px] sm:min-h-[68px]",
						isSmallMobile && "m-1 p-3"
					),
				})

				setCalled(true)
			}
		} else {
			setCalled(false)
			toast.dismiss("page-loader-toast")
		}
	}, [props.loadingItems])

	return <div className="py-3"></div>
}

export default PageLoader
