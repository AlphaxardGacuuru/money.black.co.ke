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

const ViewDeduction = ({ params }) => {
	const router = useRouter()
	const appProps = useApp()

	const [deduction, setDeduction] = useState({})
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
		// Fetch Deduction
		Axios.get(`/api/deductions/${params.id}`)
			.then((res) => {
				setDeduction(res.data.data)
				setLoading(false)
			})
			.catch((err) => {
				appProps.getErrors(err)
				setLoading(false)
			})
	}, [params.id])

	/*
	 * Print Deduction
	 */
	const printDeduction = () => {
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
				<Header title="View Deduction" />
				<div className="py-12">
					<div className="max-w-4xl mx-auto px-6 lg:px-8">
						<div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
							<div className="text-white text-center">Loading deduction...</div>
						</div>
					</div>
				</div>
			</>
		)
	}

	return (
		<>
			<Header title="View Deduction" />

			<div className="py-12">
				<div className="max-w-4xl mx-auto px-6 lg:px-8">
					{/* Action Buttons */}
					<div className="flex justify-between items-center mb-4">
						<MyLink
							href="/deductions"
							icon={<BackSVG />}
							text="Back to Deductions"
						/>
						<Btn
							icon={<PrintSVG />}
							text="Print"
							onClick={printDeduction}
						/>
					</div>

					{/* Deduction Content */}
					<div
						id="contentToPrint"
						className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 print:bg-white print:border-gray-300">
						{/* Header */}
						<div className="flex flex-col md:flex-row justify-between items-start mb-8 pb-6 border-b border-white/20 print:border-gray-300">
							<div>
								<LogoSVG />
							</div>

							<div className="text-right">
								<h2 className="text-2xl text-white font-nunito mb-2 print:text-gray-900">
									DEDUCTION
								</h2>
							</div>
						</div>

						{/* Deduction Info */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 pb-6 border-b border-white/20 print:border-gray-300">
							<div>
								<h5 className="text-white font-nunito mb-4 print:text-gray-900">
									Issued To:
								</h5>
								<div className="text-white/80 print:text-gray-700">
									<p className="font-semibold">
										{deduction.invoice?.client?.name}
									</p>
									<p>{deduction.invoice?.client?.email}</p>
									<p>{deduction.invoice?.client?.phone}</p>
									{deduction.invoice?.client?.address && (
										<p className="mt-2">{deduction.invoice?.client?.address}</p>
									)}
								</div>
							</div>

							<div className="text-right">
								<div className="space-y-2 text-white/80 print:text-gray-700">
									<p>
										<span className="font-semibold">Deduction Number:</span>{" "}
										{deduction.number}
									</p>
									<p>
										<span className="font-semibold">Invoice Number:</span>{" "}
										{deduction.invoice?.number}
									</p>
									<p>
										<span className="font-semibold">Issue Date:</span>{" "}
										{formatDate(deduction.issueDate)}
									</p>
								</div>
							</div>
						</div>

						{/* Amount Details */}
						<div className="mb-8 pb-6 border-b border-white/20 print:border-gray-300">
							<h5 className="text-white font-nunito mb-4 print:text-gray-900">
								Deduction Amount
							</h5>
							<div className="bg-white/5 rounded-2xl p-6 print:bg-gray-50">
								<div className="flex justify-between items-center">
									<span className="text-white/80 font-semibold print:text-gray-700">
										Amount:
									</span>
									<span className="text-2xl font-bold text-red-500 print:text-red-600">
										<small>KES</small> {formatCurrency(deduction.amount)}
									</span>
								</div>
							</div>
						</div>

						{/* Notes */}
						{deduction.notes && (
							<div className="mb-6">
								<h5 className="text-white font-nunito mb-4 print:text-gray-900">
									Notes
								</h5>
								<div className="bg-white/5 rounded-2xl p-6 text-white/80 print:bg-gray-50 print:text-gray-700">
									<p className="whitespace-pre-wrap">{deduction.notes}</p>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</>
	)
}

export default ViewDeduction
