"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useApp } from "@/contexts/AppContext"
import Axios from "@/lib/axios"

import Header from "@/app/(app)/Header"
import Btn from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import BackSVG from "@/svgs/BackSVG"
import { DatePicker } from "@/components/ui/date-picker"
import MyLink from "@/components/ui/my-link"

const EditDeduction = ({ params }) => {
	const router = useRouter()
	const appProps = useApp()

	const [invoices, setInvoices] = useState([])
	const [loading, setLoading] = useState(false)
	const [loadingDeduction, setLoadingDeduction] = useState(true)

	// Parse date string to local Date object (avoids timezone issues)
	const parseLocalDate = (dateStr) => {
		if (!dateStr) return null
		const [y, m, d] = dateStr.split("-")
		return new Date(y, m - 1, d)
	}

	// Deduction Details
	const [invoiceId, setInvoiceId] = useState("")
	const [amount, setAmount] = useState("")
	const [issueDate, setIssueDate] = useState(
		new Date().toISOString().split("T")[0]
	)
	const [notes, setNotes] = useState("")

	// Get data
	useEffect(() => {
		// Fetch Invoices
		appProps.get(`invoices`, setInvoices)

		// Fetch Deduction
		Axios.get(`/api/deductions/${params.id}`)
			.then((res) => {
				const deduction = res.data.data

				setInvoiceId(deduction.invoiceId)
				setAmount(deduction.amount || "")
				setIssueDate(deduction.issueDate)
				setNotes(deduction.notes || "")

				setLoadingDeduction(false)
			})
			.catch((err) => {
				appProps.getErrors(err)
				setLoadingDeduction(false)
			})
	}, [params.id])

	/*
	 * Submit Form
	 */
	const onSubmit = (e) => {
		e.preventDefault()
		setLoading(true)

		const deductionData = {
			invoiceId,
			amount: parseFloat(amount),
			issueDate,
			notes,
		}

		Axios.put(`/api/deductions/${params.id}`, deductionData)
			.then((res) => {
				setLoading(false)
				appProps.setMessages([res.data.message])
				// setTimeout(() => router.push(`/deductions`), 500)
			})
			.catch((err) => {
				setLoading(false)
				appProps.getErrors(err)
			})
	}

	if (loadingDeduction) {
		return (
			<>
				<Header title="Edit Deduction" />
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
			<Header title="Edit Deduction" />

			<div className="py-12">
				<div className="max-w-4xl mx-auto px-6 lg:px-8">
					<form onSubmit={onSubmit}>
						<div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 space-y-8">
							{/* Deduction Header Info */}
							{/* Invoice Selection Start */}
							<div className="grid grid-cols-1 gap-6">
								<Select
									label="Invoice"
									placeholder=""
									value={invoiceId}
									onChange={(e) => setInvoiceId(e.target.value)}
									disabled>
									<option value="">Select Invoice</option>
									{invoices.map((invoice, key) => (
										<option
											key={key}
											value={invoice.id}>
											{invoice.number} - {invoice.clientName} - KES{" "}
											{invoice.balance}
										</option>
									))}
								</Select>
							</div>
							{/* Invoice Selection End */}

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{/* Amount Start */}
								<Input
									type="number"
									label="Amount"
									placeholder="0.00"
									min="0"
									step="0.01"
									value={amount}
									onChange={(e) => setAmount(e.target.value)}
									required
								/>
								{/* Amount End */}

								{/* Issue Date Start */}
								<DatePicker
									label="Issue Date"
									value={parseLocalDate(issueDate)}
									onChange={(date) =>
										setIssueDate(date?.toISOString().split("T")[0] || "")
									}
								/>
								{/* Issue Date End */}
							</div>

							{/* Notes Start */}
							<div className="grid grid-cols-1 gap-6">
								<Textarea
									label="Notes"
									rows={4}
									placeholder="Additional notes or comments..."
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
								/>
							</div>
							{/* Notes End */}

							{/* Action Buttons */}
							<div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
								<MyLink
									href="/deductions"
									icon={<BackSVG />}
									text="cancel"
								/>

								<Btn
									text="Update Deduction"
									loading={loading}
								/>
							</div>
						</div>
					</form>
				</div>
			</div>
		</>
	)
}

export default EditDeduction
