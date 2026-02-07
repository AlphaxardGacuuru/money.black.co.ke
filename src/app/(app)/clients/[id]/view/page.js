"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useApp } from "@/contexts/AppContext"
import Axios from "@/lib/axios"

import Header from "@/app/(app)/Header"
import MyLink from "@/components/ui/my-link"
import Btn from "@/components/ui/button"

import BackSVG from "@/svgs/BackSVG"
import PrintSVG from "@/svgs/PrintSVG"
import LogoSVG from "@/svgs/LogoSVG"

const ViewClient = ({ params }) => {
	const router = useRouter()
	const appProps = useApp()

	const [client, setClient] = useState({})
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		// Fetch Client
		Axios.get(`/api/users/${params.id}`)
			.then((res) => {
				setClient(res.data.data)
				setLoading(false)
			})
			.catch((err) => {
				appProps.getErrors(err)
				setLoading(false)
			})
	}, [params.id])

	/*
	 * Print Client
	 */
	const printClient = () => {
		const contentToPrint = document.getElementById("contentToPrint").innerHTML
		const originalContent = document.body.innerHTML

		document.body.innerHTML = contentToPrint
		window.print()
		document.body.innerHTML = originalContent
		window.location.reload()
	}

	if (loading) {
		return (
			<>
				<Header title="View Client" />
				<div className="py-12">
					<div className="max-w-4xl mx-auto px-6 lg:px-8">
						<div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
							<div className="text-white text-center">Loading client...</div>
						</div>
					</div>
				</div>
			</>
		)
	}

	return (
		<>
			<Header title="View Client" />

			<div className="py-12">
				<div className="max-w-4xl mx-auto px-6 lg:px-8">
					{/* Action Buttons */}
					<div className="flex justify-between items-center mb-4">
						<MyLink
							href="/clients"
							icon={<BackSVG />}
							text="Back to Clients"
						/>
						<Btn
							icon={<PrintSVG />}
							text="Print"
							onClick={printClient}
						/>
					</div>

					{/* Client Content */}
					<div
						id="contentToPrint"
						className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 print:bg-white print:border-gray-300">
						{/* Header */}
						<div className="flex flex-col md:flex-row justify-between items-start mb-8 pb-6 border-b border-white/20 print:border-gray-300">
							<div className="text-white print:text-gray-900">
								<div className="text-4xl mb-2">
									<LogoSVG />
								</div>
							</div>

							<div className="text-right">
								<h2 className="text-2xl text-white font-nunito mb-2 print:text-gray-900">
									CLIENT DETAILS
								</h2>
							</div>
						</div>

						{/* Client Info */}
						<div className="space-y-6">
							{/* Basic Information */}
							<div className="bg-white/5 rounded-2xl p-6 print:bg-gray-50">
								<h5 className="text-white font-nunito mb-4 print:text-gray-900">
									Basic Information
								</h5>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<span className="text-white/60 text-sm print:text-gray-600">
											Name:
										</span>
										<p className="text-white font-semibold print:text-gray-900">
											{client.name}
										</p>
									</div>
									<div>
										<span className="text-white/60 text-sm print:text-gray-600">
											Email:
										</span>
										<p className="text-white print:text-gray-900">
											{client.email}
										</p>
									</div>
									<div>
										<span className="text-white/60 text-sm print:text-gray-600">
											Phone:
										</span>
										<p className="text-white print:text-gray-900">
											{client.phone}
										</p>
									</div>
								</div>
							</div>

							{/* Statistics */}
							{(client.invoicesCount !== undefined ||
								client.totalInvoiced !== undefined) && (
								<div className="bg-white/5 rounded-2xl p-6 print:bg-gray-50">
									<h5 className="text-white font-nunito mb-4 print:text-gray-900">
										Statistics
									</h5>
									<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
										{client.invoicesCount !== undefined && (
											<div>
												<span className="text-white/60 text-sm print:text-gray-600">
													Total Invoices:
												</span>
												<p className="text-2xl font-bold text-blue-400 print:text-blue-600">
													{client.invoicesCount}
												</p>
											</div>
										)}
										{client.totalInvoiced !== undefined && (
											<div>
												<span className="text-white/60 text-sm print:text-gray-600">
													Total Invoiced:
												</span>
												<p className="text-2xl font-bold text-green-400 print:text-green-600">
													<small>KES</small> {client.totalInvoiced}
												</p>
											</div>
										)}
										{client.totalPaid !== undefined && (
											<div>
												<span className="text-white/60 text-sm print:text-gray-600">
													Total Paid:
												</span>
												<p className="text-2xl font-bold text-yellow-400 print:text-yellow-600">
													<small>KES</small> {client.totalPaid}
												</p>
											</div>
										)}
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</>
	)
}

export default ViewClient
