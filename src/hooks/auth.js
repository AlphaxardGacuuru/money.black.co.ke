import useSWR from "swr"
import axios from "@/lib/axios"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useApp } from "@/contexts/AppContext"

export const useAuth = ({ middleware, redirectIfAuthenticated } = {}) => {
	const appProps = useApp()
	const router = useRouter()
	const params = useParams()

	const [authLoading, setAuthLoading] = useState(false)

	const {
		data: user,
		error,
		mutate,
	} = useSWR("/api/user", () =>
		axios
			.get("/api/user")
			.then((res) => res.data)
			.catch((error) => {
				if (error.response.status !== 409) throw error

				router.push("/verify-email")
			})
	)

	const csrf = () => axios.get("/sanctum/csrf-cookie")

	const register = async ({ setErrors, ...props }) => {
		await csrf()

		setErrors([])
		setAuthLoading(true)

		axios
			.post("/register", props)
			.then(() => {
				setAuthLoading(false)
				mutate()
			})
			.catch((error) => {
				setAuthLoading(false)

				if (error.response.status !== 422) throw error

				setErrors(error.response.data.errors)
			})
	}

	const login = async ({ setErrors, setStatus, ...props }) => {
		await csrf()

		setErrors([])
		setStatus(null)
		setAuthLoading(true)

		axios
			.post("/login", props)
			.then((res) => {
				setAuthLoading(false)
				appProps.setMessages(["Login Successful!"])

                mutate()
            })
			.catch((error) => {
				setAuthLoading(false)

				if (error.response.status !== 422) throw error

				setErrors(error.response.data.errors)
			})
	}

	const forgotPassword = async ({ setErrors, setStatus, email }) => {
		await csrf()

		setErrors([])
		setStatus(null)

		axios
			.post("/forgot-password", { email })
			.then((response) => setStatus(response.data.status))
			.catch((error) => {
				if (error.response.status !== 422) throw error

				setErrors(error.response.data.errors)
			})
	}

	const resetPassword = async ({ setErrors, setStatus, ...props }) => {
		await csrf()

		setErrors([])
		setStatus(null)

		axios
			.post("/reset-password", { token: params.token, ...props })
			.then((response) =>
				router.push("/login?reset=" + btoa(response.data.status))
			)
			.catch((error) => {
				if (error.response.status !== 422) throw error

				setErrors(error.response.data.errors)
			})
	}

	const resendEmailVerification = ({ setStatus }) => {
		axios
			.post("/email/verification-notification")
			.then((response) => setStatus(response.data.status))
	}

	const logout = async () => {
		if (!error) {
			await axios.post("/logout").then(() => mutate())
		}

		window.location.pathname = "/login"
	}

	useEffect(() => {
		if (middleware === "guest" && redirectIfAuthenticated && user)
			router.push(redirectIfAuthenticated)

		// if (middleware === 'auth' && (user && !user.email_verified_at))
		//     router.push('/verify-email')

		if (window.location.pathname === "/verify-email" && user?.email_verified_at)
			router.push(redirectIfAuthenticated)
		if (middleware === "auth" && error) logout()
	}, [user, error])

	return {
		user,
		register,
		login,
		forgotPassword,
		resetPassword,
		resendEmailVerification,
		logout,
		authLoading,
	}
}
