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

const ViewPayment = ({ params }) => {
	const router = useRouter()
	const appProps = useApp()

	const [payment, setPayment] = useState({})
	const [loading, setLoading] = useState(true)

	// Format currency with commas
	const formatCurrency = (amount) => {
		if (!amount) return "0.00"
		const numAmount = parseFloat(amount.toString().replace(/,/g, ""))
		return numAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
	}

	// Format date from YYYY-MM-DD to DD-MM-YYYY
	const formatDate = (dateString) => {
		if (!dateString) return ""
		const [year, month, day] = dateString.split("-")
		return `${day}-${month}-${year}`
	}

	useEffect(() => {
		// Fetch Payment
		Axios.get(`/api/payments/${params.id}`)
			.then((res) => {
				setPayment(res.data.data)
				setLoading(false)
			})
			.catch((err) => {
				appProps.getErrors(err)
				setLoading(false)
			})
	}, [params.id])

	/*
	 * Print Payment
	 */
	const printPayment = () => {
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
				<Header title="View Payment" />
				<div className="py-12">
					<div className="max-w-4xl mx-auto px-6 lg:px-8">
						<div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
							<div className="text-white text-center">Loading payment...</div>
						</div>
					</div>
				</div>
			</>
		)
	}

	return (
		<>
			<Header title="View Payment" />

			<div className="py-12">
				<div className="max-w-4xl mx-auto px-6 lg:px-8">
					{/* Action Buttons */}
					<div className="flex justify-between items-center mb-4">
						<MyLink
							href="/payments"
							icon={<BackSVG />}
							text="Back to Payments"
						/>
						<Btn
							icon={<PrintSVG />}
							text="Print"
							onClick={printPayment}
						/>
					</div>

					{/* Payment Content */}
					<div
						id="contentToPrint"
						className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 print:bg-white print:border-gray-300">
						{/* Payment Header */}
						<div className="flex justify-between items-start mb-8 pb-6 border-b border-white/20 print:border-gray-300">
							<div className="text-white print:text-gray-900">
								<div className="text-4xl mb-2">
									<LogoSVG />
								</div>
							</div>

							<div className="text-right">
								<h2 className="text-2xl text-white font-nunito mb-2 print:text-gray-900">
									PAYMENT RECEIPT
								</h2>
							</div>
						</div>

						{/* Payment Info */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
							<div className="text-white print:text-gray-900">
								<h5 className="text-lg font-nunito mb-4">Payment From</h5>
								<div className="text-white/80 print:text-gray-700 space-y-1">
									<div>Client: {payment.clientName}</div>
									<div>Email: {payment.clientEmail}</div>
									{payment.clientPhone && (
										<div>Phone: {payment.clientPhone}</div>
									)}
								</div>
							</div>
							<div className="text-right text-white print:text-gray-900">
								<h5 className="text-lg font-nunito mb-4">Payment Details</h5>
								<div className="text-white/80 print:text-gray-700 space-y-1">
									<div>Payment Date: {formatDate(payment.paymentDate)}</div>
								</div>
							</div>
						</div>

						{/* Payment Details Table */}
						<div className="overflow-x-auto mb-8">
							<table className="w-full">
								<thead className="border-b border-white/20 print:border-gray-300">
									<tr className="text-white/60 print:text-gray-700">
										<th className="text-left py-3 font-nunito font-normal">
											Description
										</th>
										<th className="text-right py-3 font-nunito font-normal">
											Amount
										</th>
									</tr>
								</thead>
								<tbody>
									<tr className="border-b border-white/10 print:border-gray-200">
										<td className="py-4 text-white print:text-gray-900">
											Payment for Invoice: {payment.invoiceNumber}
										</td>
										<td className="py-4 text-right text-white print:text-gray-900">
											<small className="mr-1">KES</small>
											{formatCurrency(payment.amount)}
										</td>
									</tr>

									{/* Total */}
									<tr className="border-t-2 border-white/30 print:border-gray-400">
										<td className="py-4 text-right text-white text-lg font-nunito print:text-gray-900">
											Total Paid:
										</td>
										<td className="py-4 text-right text-white text-lg font-nunito font-medium print:text-gray-900">
											<small className="mr-1">KES</small>
											{formatCurrency(payment.amount)}
										</td>
									</tr>
								</tbody>
							</table>
						</div>

						{/* Notes */}
						{payment.notes && (
							<div className="mb-8 pb-6 border-b border-white/20 print:border-gray-300">
								<h5 className="text-white font-nunito mb-2 print:text-gray-900">
									Notes
								</h5>
								<p className="text-white/80 text-sm print:text-gray-700">
									{payment.notes}
								</p>
							</div>
						)}

						{/* Footer */}
						<div className="text-center mb-4">
							<h4 className="text-white text-xl font-nunito print:text-gray-900">
								Thank you for your payment!
							</h4>
						</div>

						<div className="flex justify-end">
							<div className="text-right text-white print:text-gray-900">
								<h3 className="text-xl font-nunito mb-2">Black Developers</h3>
								<div className="text-white/80 text-sm print:text-gray-700">
									<div>Email: al@black.co.ke</div>
									<div>Phone: +254 700 364446</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}

export default ViewPayment
