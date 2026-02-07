"use client"

import { useEffect, useRef } from "react"
import axios from "@/lib/axios"

export default function CsrfInitializer() {
	const initialized = useRef(false)

	useEffect(() => {
		// Only initialize once, even in strict mode
		if (!initialized.current) {
			initialized.current = true
			
			axios.get("/sanctum/csrf-cookie").catch((error) => {
				console.error("Failed to initialize CSRF cookie:", error)
			})
		}
	}, [])

	return null
}
