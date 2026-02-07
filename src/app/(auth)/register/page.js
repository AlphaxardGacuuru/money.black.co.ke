"use client"

import Link from "next/link"
import { useAuth } from "@/hooks/auth"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Btn } from "@/components/ui/button"

const Page = () => {
	const { register, authLoading } = useAuth({
		middleware: "guest",
		redirectIfAuthenticated: "/dashboard",
	})

	const [name, setName] = useState("")
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [passwordConfirmation, setPasswordConfirmation] = useState("")
	const [errors, setErrors] = useState([])

	const submitForm = (event) => {
		event.preventDefault()

		register({
			name,
			email,
			password,
			password_confirmation: passwordConfirmation,
			setErrors,
		})
	}

	return (
		<>
			<div className="text-center mb-8">
				<h2 className="text-3xl sm:text-4xl font-light text-white font-nunito mb-3">
					Create Account
				</h2>
				<p className="text-white/60 font-light font-nunito text-lg">
					Sign up to get started with Black Developers
				</p>
			</div>

			<form
				onSubmit={submitForm}
				className="space-y-6">
				{/* Name */}
				<div className="space-y-2">
					<Input
						label="Name"
						id="name"
						type="text"
						value={name}
						placeholder="Your name"
						onChange={(event) => setName(event.target.value)}
						required
						autoFocus
					/>
					{errors.name && (
						<p className="text-sm text-red-400 font-light font-nunito">
							{errors.name[0]}
						</p>
					)}
				</div>

				{/* Email Address */}
				<div className="space-y-2">
					<Input
						label="Email"
						id="email"
						type="email"
						value={email}
						placeholder="your@email.com"
						onChange={(event) => setEmail(event.target.value)}
						required
					/>
					{errors.email && (
						<p className="text-sm text-red-400 font-light font-nunito">
							{errors.email[0]}
						</p>
					)}
				</div>

				{/* Password */}
				<div className="space-y-2">
					<Input
						label="Password"
						id="password"
						type="password"
						value={password}
						placeholder="••••••••"
						onChange={(event) => setPassword(event.target.value)}
						required
						autoComplete="new-password"
					/>
					{errors.password && (
						<p className="text-sm text-red-400 font-light font-nunito">
							{errors.password[0]}
						</p>
					)}
				</div>

				{/* Confirm Password */}
				<div className="space-y-2">
					<Input
						label="Confirm Password"
						id="passwordConfirmation"
						type="password"
						value={passwordConfirmation}
						placeholder="••••••••"
						onChange={(event) => setPasswordConfirmation(event.target.value)}
						required
					/>
					{errors.password_confirmation && (
						<p className="text-sm text-red-400 font-light font-nunito">
							{errors.password_confirmation[0]}
						</p>
					)}
				</div>

				<Btn
					type="submit"
					className="w-full"
					text="Sign Up"
					loading={authLoading}
				/>

				<div className="text-center">
					<p className="text-white/60 font-light font-nunito text-sm">
						Already have an account?{" "}
						<Link
							href="/login"
							className="text-white hover:text-white/80 transition-colors">
							Sign in
						</Link>
					</p>
				</div>
			</form>
		</>
	)
}

export default Page
