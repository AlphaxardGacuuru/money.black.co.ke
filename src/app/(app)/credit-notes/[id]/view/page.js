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

const ViewCreditNote = ({ params }) => {
	const router = useRouter()
	const appProps = useApp()

	const [creditNote, setCreditNote] = useState({})
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
		// Fetch Credit Note
		Axios.get(`/api/credit-notes/${params.id}`)
			.then((res) => {
				setCreditNote(res.data.data)
				setLoading(false)
			})
			.catch((err) => {
				appProps.getErrors(err)
				setLoading(false)
			})
	}, [params.id])

	/*
	 * Print Credit Note
	 */
	const printCreditNote = () => {
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
				<Header title="View Credit Note" />
				<div className="py-12">
					<div className="max-w-4xl mx-auto px-6 lg:px-8">
						<div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
							<div className="text-white text-center">
								Loading credit note...
							</div>
						</div>
					</div>
				</div>
			</>
		)
	}

	return (
		<>
			<Header title="View Credit Note" />

			<div className="py-12">
				<div className="max-w-4xl mx-auto px-6 lg:px-8">
					{/* Action Buttons */}
					<div className="flex justify-between items-center mb-4">
						<MyLink
							href="/credit-notes"
							icon={<BackSVG />}
							text="Back to Credit Notes"
						/>
						<Btn
							icon={<PrintSVG />}
							text="Print"
							onClick={printCreditNote}
						/>
					</div>

					{/* Credit Note Content */}
					<div
						id="contentToPrint"
						className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 print:bg-white print:border-gray-300">
						{/* Credit Note Header */}
						<div className="flex justify-between items-start mb-8 pb-6 border-b border-white/20 print:border-gray-300">
							<div className="text-white print:text-gray-900">
								<div className="text-4xl mb-2">
									<LogoSVG />
								</div>
							</div>

							<div className="text-right">
								<h2 className="text-2xl text-white font-nunito mb-2 print:text-gray-900">
									CREDIT NOTE
								</h2>

								<h5 className="text-white font-nunito mb-4 print:text-gray-900">
									Issued To:
								</h5>
								<div className="text-white/80 print:text-gray-700">
									<p className="font-semibold">
										{creditNote.invoice?.client?.name}
									</p>
									<p>{creditNote.invoice?.client?.email}</p>
									<p>{creditNote.invoice?.client?.phone}</p>
								</div>
							</div>

							<div className="text-left md:text-right">
								<div className="space-y-2">
									<p className="text-white/80 print:text-gray-700">
										<span className="font-semibold text-white print:text-gray-900">
											Credit Note #:
										</span>{" "}
										{creditNote.number}
									</p>
									<p className="text-white/80 print:text-gray-700">
										<span className="font-semibold text-white print:text-gray-900">
											Related Invoice #:
										</span>{" "}
										{creditNote.invoice?.number}
									</p>
									<p className="text-white/80 print:text-gray-700">
										<span className="font-semibold text-white print:text-gray-900">
											Issue Date:
										</span>{" "}
										{formatDate(creditNote.issueDate)}
									</p>
								</div>
							</div>
						</div>

						{/* Credit Amount */}
						<div className="mb-8 pb-6 border-b border-white/20 print:border-gray-300">
							<div className="flex justify-between items-center p-6 bg-white/5 border border-white/10 rounded-xl print:bg-gray-50 print:border-gray-300">
								<span className="text-white font-nunito font-semibold text-lg print:text-gray-900">
									Credit Amount:
								</span>
								<span className="text-white font-nunito font-semibold text-2xl print:text-gray-900">
									KES {formatCurrency(parseFloat(creditNote.amount))}
								</span>
							</div>
						</div>

						{/* Notes */}
						{creditNote.notes && (
							<div className="mb-8 pb-6 border-b border-white/20 print:border-gray-300">
								<h5 className="text-white font-nunito mb-2 print:text-gray-900">
									Notes
								</h5>
								<p className="text-white/80 text-sm print:text-gray-700">
									{creditNote.notes}
								</p>
							</div>
						)}

						{/* Footer */}
						<div className="text-center mb-4">
							<p className="text-white/60 text-sm print:text-gray-500">
								Thank you for your business
							</p>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex justify-end items-center gap-4 mt-6">
						<MyLink
							href={`/credit-notes/${creditNote.id}/edit`}
							icon={<BackSVG />}
							text="Edit Credit Note"
						/>
					</div>
				</div>
			</div>
		</>
	)
}

export default ViewCreditNote
