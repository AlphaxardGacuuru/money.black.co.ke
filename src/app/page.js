"use client"

import LoginLinks from "@/app/LoginLinks"
import ApplicationLogo from "@/components/ApplicationLogo"
import { useState, useEffect } from "react"

const Home = () => {
	const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
	const [scrollY, setScrollY] = useState(0)

	useEffect(() => {
		const handleMouseMove = (e) => {
			setMousePosition({ x: e.clientX, y: e.clientY })
		}

		const handleScroll = () => {
			setScrollY(window.scrollY)
		}

		window.addEventListener("mousemove", handleMouseMove)
		window.addEventListener("scroll", handleScroll)

		return () => {
			window.removeEventListener("mousemove", handleMouseMove)
			window.removeEventListener("scroll", handleScroll)
		}
	}, [])

	return (
		<div className="min-h-screen overflow-x-hidden relative">
			<LoginLinks />

			{/* Animated background gradients */}
			<div className="fixed inset-0 overflow-hidden pointer-events-none">
				<div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-r from-[#232323]/20 to-[#3a3a3a]/30 rounded-full blur-3xl animate-pulse" />
				<div className="absolute top-1/3 -right-40 w-80 h-80 bg-gradient-to-l from-[#3a3a3a]/30 to-[#232323]/20 rounded-full blur-3xl animate-pulse animation-delay-1000" />
				<div className="absolute bottom-20 left-1/4 w-64 h-64 bg-gradient-to-t from-[#4a4a4a]/30 to-[#232323]/20 rounded-full blur-2xl animate-pulse animation-delay-2000" />
			</div>

			{/* Mouse follower gradient - Light Effect */}
			<div
				className="fixed w-[500px] h-[500px] bg-gradient-radial from-white/30 via-blue-200/40 to-transparent rounded-full pointer-events-none blur-3xl transition-all duration-700 ease-out -translate-x-1/2 -translate-y-1/2 z-10"
				style={{
					left: mousePosition.x,
					top: mousePosition.y,
				}}
			/>

			{/* Hero Section */}
			<section className="relative min-h-screen flex items-center justify-center px-6 lg:px-8">
				<div
					className="absolute inset-0 bg-gradient-to-b from-transparent via-[#232323]/10 to-[#232323]/20"
					style={{
						transform: `translateY(${scrollY * 0.5}px)`,
					}}
				/>

				{/* Hero decorative elements */}
				<div className="absolute inset-0 overflow-hidden pointer-events-none">
					<div className="absolute top-20 left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl animate-pulse" />
					<div className="absolute bottom-32 right-16 w-48 h-48 bg-blue-400/10 rounded-full blur-3xl animate-pulse animation-delay-1000" />
					<div className="absolute top-1/2 left-1/4 w-24 h-24 bg-purple-400/8 rounded-full blur-xl animate-pulse animation-delay-2000" />
				</div>

				<div className="relative z-10 text-center max-w-6xl mx-auto">
					{/* Company Logo - Clean & Minimal */}
					<div className="mb-5 relative">
						{/* Subtle glow effect behind logo */}
						<div className="absolute inset-0 flex items-center justify-center">
							<div className="w-96 h-32 bg-gradient-to-r from-transparent via-white/10 to-transparent blur-2xl" />
						</div>

						{/* Logo standalone */}
						<div className="relative transform hover:scale-105 sm:hover:scale-110 transition-all duration-700 ease-out group cursor-pointer">
							<div className="mx-auto w-48 sm:w-64 md:w-80 h-12 sm:h-16 md:h-20 flex items-center justify-center">
								<div className="text-white opacity-90 group-hover:opacity-100 transition-opacity duration-500 text-md sm:text-2xl md:text-3xl">
									<ApplicationLogo />
								</div>
							</div>
						</div>
					</div>

					{/* Main Headlines */}
					<div className="space-y-8 mb-16">
						<div className="relative">
							<h2 className="text-2xl sm:text-3xl lg:text-4xl font-thin text-gray-400 tracking-wide font-nunito">
								Smart Financial Management Made Simple
							</h2>
							<div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-0.5 bg-gradient-to-r from-transparent via-[#232323] to-transparent" />
						</div>

						{/* App Description */}
						<div className="mt-20 p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all duration-700 ease-out group">
							<p className="text-gray-300 text-lg leading-relaxed max-w-2xl mx-auto">
								Take control of your finances with Black Money - a comprehensive
								financial management platform designed to streamline invoicing,
								track payments, manage deductions, and handle credit notes with
								ease.
							</p>
						</div>
					</div>

					{/* CTA Buttons */}
					{/* Scroll indicator */}
					<div className="flex justify-center bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
						<div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center bg-white/20 backdrop-blur-sm">
							<div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse" />
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section
				id="features"
				className="py-32 relative bg-gradient-to-b from-[#000000] via-[#1a1a1a] to-[#232323]">
				<div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent" />

				{/* Feature section decorative elements */}
				<div className="absolute inset-0 overflow-hidden pointer-events-none">
					<div className="absolute top-10 right-20 w-40 h-40 bg-white/20 rounded-full blur-3xl animate-pulse" />
					<div className="absolute bottom-20 left-16 w-56 h-56 bg-blue-400/20 rounded-full blur-3xl animate-pulse animation-delay-1000" />
					<div className="absolute top-1/2 right-1/3 w-32 h-32 bg-purple-400/15 rounded-full blur-2xl animate-pulse animation-delay-2000" />
				</div>

				<div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
					<div className="text-center mb-20">
						<h2 className="text-5xl sm:text-6xl font-extralight text-white mb-6 tracking-tight font-roboto drop-shadow-sm">
							Powerful{" "}
							<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-purple-400 font-light">
								Features
							</span>
						</h2>
						<p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-light font-nunito">
							Everything you need to manage your business finances efficiently,
							all in one powerful platform.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
						{/* Feature 1 */}
						<div className="group relative p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 hover:border-white/40 hover:shadow-2xl hover:shadow-white/10 transition-all duration-700 hover:scale-110 hover:rotate-2">
							<div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/15 opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity duration-500" />
							<div className="absolute -inset-1 bg-gradient-to-r from-white/20 via-blue-400/30 to-purple-400/30 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
							<div className="relative z-10">
								<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#232323] to-gray-700 flex items-center justify-center mb-6 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-700 shadow-lg">
									<svg
										className="w-8 h-8 text-white"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
										/>
									</svg>
								</div>
								<h3 className="text-2xl font-light text-white mb-4 font-nunito">
									Invoice Management
								</h3>
								<p className="text-gray-300 leading-relaxed mb-6 font-light font-nunito">
									Create, send, and track professional invoices with ease.
									Monitor payment status and automate reminders.
								</p>
							</div>
						</div>

						{/* Feature 2 */}
						<div className="group relative p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 hover:border-white/50 transition-all duration-700 hover:scale-105 hover:-rotate-1">
							<div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity duration-500" />
							<div className="relative z-10">
								<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#232323] to-[#1a1a1a] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
									<svg
										className="w-8 h-8 text-white"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
										/>
									</svg>
								</div>
								<h3 className="text-2xl font-light text-white mb-4 font-nunito">
									Payment Tracking
								</h3>
								<p className="text-gray-300 leading-relaxed mb-6 font-light font-nunito">
									Record and track all payments received. Get real-time insights
									into your cash flow and outstanding balances.
								</p>
							</div>
						</div>

						{/* Feature 3 */}
						<div className="group relative p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 hover:border-white/50 transition-all duration-700 hover:scale-105 hover:rotate-1">
							<div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity duration-500" />
							<div className="relative z-10">
								<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#232323] to-[#1a1a1a] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
									<svg
										className="w-8 h-8 text-white"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
								</div>
								<h3 className="text-2xl font-light text-white mb-4 font-nunito">
									Deduction Management
								</h3>
								<p className="text-gray-300 leading-relaxed mb-6 font-light font-nunito">
									Manage all deductions systematically. Keep track of taxes,
									commissions, and other deductions automatically.
								</p>
							</div>
						</div>

						{/* Feature 4 */}
						<div className="group relative p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 hover:border-white/50 transition-all duration-700 hover:scale-105 hover:-rotate-1">
							<div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity duration-500" />
							<div className="relative z-10">
								<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#232323] to-[#1a1a1a] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
									<svg
										className="w-8 h-8 text-white"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
										/>
									</svg>
								</div>
								<h3 className="text-2xl font-light text-white mb-4 font-nunito">
									Credit Notes
								</h3>
								<p className="text-gray-300 leading-relaxed mb-6 font-light font-nunito">
									Issue and manage credit notes efficiently. Handle refunds,
									adjustments, and corrections seamlessly.
								</p>
							</div>
						</div>

						{/* Feature 5 */}
						<div className="group relative p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 hover:border-white/50 transition-all duration-700 hover:scale-105 hover:rotate-1">
							<div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity duration-500" />
							<div className="relative z-10">
								<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#232323] to-[#1a1a1a] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
									<svg
										className="w-8 h-8 text-white"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
										/>
									</svg>
								</div>
								<h3 className="text-2xl font-light text-white mb-4 font-nunito">
									Client Management
								</h3>
								<p className="text-gray-300 leading-relaxed mb-6 font-light font-nunito">
									Organize and manage client information, transaction history,
									and outstanding balances in one place.
								</p>
							</div>
						</div>

						{/* Feature 6 */}
						<div className="group relative p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 hover:border-white/50 transition-all duration-700 hover:scale-105 hover:-rotate-1">
							<div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity duration-500" />
							<div className="relative z-10">
								<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#232323] to-[#1a1a1a] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
									<svg
										className="w-8 h-8 text-white"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
										/>
									</svg>
								</div>
								<h3 className="text-2xl font-light text-white mb-4 font-nunito">
									Financial Reports
								</h3>
								<p className="text-gray-300 leading-relaxed mb-6 font-light font-nunito">
									Generate comprehensive financial reports and insights to make
									informed business decisions.
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="bg-[#232323] border-t border-white/10">
				<div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
					<div className="text-center">
						<div className="mb-8">
							<div className="mx-auto w-48 sm:w-64 h-12 sm:h-16 flex items-center justify-center">
								<div className="text-white opacity-90">
									<ApplicationLogo />
								</div>
							</div>
						</div>

						<p className="text-gray-300 text-lg leading-relaxed max-w-2xl mx-auto mb-8">
							Smart financial management made simple. Take control of your
							business finances with Black Money.
						</p>

						<div className="border-t border-white/10 mt-12 pt-8">
							<p className="text-gray-400">
								&copy; 2026 Black Money. All rights reserved.
							</p>
						</div>
					</div>
				</div>
			</footer>
		</div>
	)
}

export default Home
