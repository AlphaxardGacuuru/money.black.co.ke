"use client"

import { useState, useEffect } from "react"
import { useApp } from "@/contexts/AppContext"
import Header from "@/app/(app)/Header"
import HeroHeading from "@/components/core/HeroHeading"
import HeroIcon from "@/components/core/HeroIcon"
import InvoiceSVG from "@/svgs/InvoiceSVG"
import PaymentSVG from "@/svgs/PaymentSVG"
import CreditNoteSVG from "@/svgs/CreditNoteSVG"
import DeductionSVG from "@/svgs/DeductionSVG"
import MoneySVG from "@/svgs/MoneySVG"
import PeopleSVG from "@/svgs/PeopleSVG"
import Axios from "@/lib/axios"

const Dashboard = () => {
	const appProps = useApp()

	const [stats, setStats] = useState({
		clients: { count: 0 },
		invoices: { count: 0, total: 0 },
		payments: { count: 0, total: 0 },
		creditNotes: { count: 0, total: 0 },
		deductions: { count: 0, total: 0 },
	})
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		// Fetch dashboard stats
		Axios.get("api/dashboard-stats")
			.then((res) => {
				setStats(res.data)
				setLoading(false)
			})
			.catch((err) => {
				appProps.getErrors(err)
				setLoading(false)
			})
	}, [])

	// Format currency
	const formatCurrency = (amount) => {
		if (!amount) return "0.00"
		const numAmount = parseFloat(amount.toString().replace(/,/g, ""))
		return numAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
	}

	return (
		<>
			<Header title="Dashboard" />
			<div className="py-12">
				<div className="max-w-7xl mx-auto px-6 lg:px-8">
					{/* Welcome Section */}
					<div className="bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden rounded-3xl hover:border-white/20 transition-all duration-700 mb-8">
						<div className="p-8 text-white">
							<h3 className="text-2xl font-light font-nunito mb-4">
								Welcome Back!
							</h3>
							<p className="text-gray-300 font-light font-nunito">
								Here's an overview of your business metrics
							</p>
						</div>
					</div>

					{/* Stats Grid Start */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-6">
						{/* Clients Stat */}
						<div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-sm rounded-3xl p-6 hover:bg-white/15 transition-all duration-500">
							<div className="flex justify-between items-center mb-4">
								<HeroHeading
									heading="Clients"
									data={loading ? "..." : stats.clients.count}
								/>
								<HeroIcon color="purple">
									<PeopleSVG />
								</HeroIcon>
							</div>
							<div className="text-sm text-white/70 mt-2">
								<span className="text-purple-400 font-semibold">
									Active Clients
								</span>
							</div>
						</div>

						{/* Invoices Stat */}
						<div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-sm rounded-3xl p-6 hover:bg-white/15 transition-all duration-500">
							<div className="flex justify-between items-center mb-4">
								<HeroHeading
									heading="Invoices"
									data={loading ? "..." : stats.invoices.count}
								/>
								<HeroIcon color="blue">
									<InvoiceSVG />
								</HeroIcon>
							</div>
							<div className="text-sm text-white/70 mt-2">
								Total:{" "}
								<span className="text-blue-400 font-semibold">
									KES {loading ? "..." : formatCurrency(stats.invoices.total)}
								</span>
							</div>
						</div>
					</div>
					{/* Stats Grid End */}

					{/* Stats Grid Start */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{/* Payments Stat */}
						<div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-sm rounded-3xl p-6 hover:bg-white/15 transition-all duration-500">
							<div className="flex justify-between items-center mb-4">
								<HeroHeading
									heading="Payments"
									data={loading ? "..." : stats.payments.count}
								/>
								<HeroIcon color="green">
									<PaymentSVG />
								</HeroIcon>
							</div>
							<div className="text-sm text-white/70 mt-2">
								Total:{" "}
								<span className="text-green-400 font-semibold">
									KES {loading ? "..." : formatCurrency(stats.payments.total)}
								</span>
							</div>
						</div>

						{/* Credit Notes Stat */}
						<div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-sm rounded-3xl p-6 hover:bg-white/15 transition-all duration-500">
							<div className="flex justify-between items-center mb-4">
								<HeroHeading
									heading="Credit Notes"
									data={loading ? "..." : stats.creditNotes.count}
								/>
								<HeroIcon color="yellow">
									<CreditNoteSVG />
								</HeroIcon>
							</div>
							<div className="text-sm text-white/70 mt-2">
								Total:{" "}
								<span className="text-yellow-400 font-semibold">
									KES{" "}
									{loading ? "..." : formatCurrency(stats.creditNotes.total)}
								</span>
							</div>
						</div>

						{/* Deductions Stat */}
						<div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-sm rounded-3xl p-6 hover:bg-white/15 transition-all duration-500">
							<div className="flex justify-between items-center mb-4">
								<HeroHeading
									heading="Deductions"
									data={loading ? "..." : stats.deductions.count}
								/>
								<HeroIcon color="red">
									<DeductionSVG />
								</HeroIcon>
							</div>
							<div className="text-sm text-white/70 mt-2">
								Total:{" "}
								<span className="text-red-400 font-semibold">
									KES {loading ? "..." : formatCurrency(stats.deductions.total)}
								</span>
							</div>
						</div>
					</div>
					{/* Stats Grid End */}

					{/* Summary Section */}
					<div className="bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden rounded-3xl hover:border-white/20 transition-all duration-700 mt-8">
						<div className="p-8">
							<div className="flex justify-between items-center">
								<div>
									<h4 className="text-white/70 font-normal text-sm uppercase tracking-wider mb-2">
										Net Balance
									</h4>
									<p className="text-3xl font-bold text-white">
										KES{" "}
										{loading
											? "..."
											: formatCurrency(
													(stats.invoices.total || 0) +
														(stats.payments.total || 0) -
														(stats.creditNotes.total || 0) -
														(stats.deductions.total || 0)
												)}
									</p>
								</div>
								<HeroIcon>
									<MoneySVG />
								</HeroIcon>
							</div>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
								<div>
									<p className="text-white/50 text-xs uppercase">Invoiced</p>
									<p className="text-blue-400 font-semibold">
										+{loading ? "..." : formatCurrency(stats.invoices.total)}
									</p>
								</div>
								<div>
									<p className="text-white/50 text-xs uppercase">Received</p>
									<p className="text-green-400 font-semibold">
										+{loading ? "..." : formatCurrency(stats.payments.total)}
									</p>
								</div>
								<div>
									<p className="text-white/50 text-xs uppercase">Credits</p>
									<p className="text-yellow-400 font-semibold">
										-{loading ? "..." : formatCurrency(stats.creditNotes.total)}
									</p>
								</div>
								<div>
									<p className="text-white/50 text-xs uppercase">Deductions</p>
									<p className="text-red-400 font-semibold">
										-{loading ? "..." : formatCurrency(stats.deductions.total)}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}

export default Dashboard
