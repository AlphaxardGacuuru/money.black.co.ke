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

const EditPayment = ({ params }) => {
	const router = useRouter()
	const appProps = useApp()

	const [invoices, setInvoices] = useState([])
	const [loading, setLoading] = useState(false)
	const [loadingPayment, setLoadingPayment] = useState(true)

	// Payment Details
	const [invoiceId, setInvoiceId] = useState("")
	const [amount, setAmount] = useState("")
	const [paymentDate, setPaymentDate] = useState(
		new Date().toISOString().split("T")[0]
	)
	const [notes, setNotes] = useState("")

	// Get data
	useEffect(() => {
		// Fetch Invoices
		appProps.get(`invoices`, setInvoices)

		setLoadingPayment(false)

		// Fetch Payment
		Axios.get(`/api/payments/${params.id}`)
			.then((res) => {
				const payment = res.data.data

				setLoadingPayment(false)
				setInvoiceId(payment.invoiceId || "")
				// Remove commas from amount string and convert to number
				const cleanAmount = payment.amount ? String(payment.amount).replace(/,/g, "") : ""
				setAmount(cleanAmount)
				setPaymentDate(
					payment.paymentDate || new Date().toISOString().split("T")[0]
				)
				setNotes(payment.notes || "")
			})
			.catch((err) => {
				setLoadingPayment(false)
				appProps.getErrors(err)
			})
	}, [params.id])

	/*
	 * Submit Form
	 */
	const onSubmit = (e) => {
		e.preventDefault()
		setLoading(true)

		const paymentData = {
			invoiceId,
			// Remove any commas before parsing
			amount: parseFloat(String(amount).replace(/,/g, "")),
			paymentDate,
			notes,
		}

		Axios.put(`/api/payments/${params.id}`, paymentData)
			.then((res) => {
				setLoading(false)
				appProps.setMessages([res.data.message])
				setTimeout(() => router.push(`/payments`), 500)
			})
			.catch((err) => {
				setLoading(false)
				appProps.getErrors(err)
			})
	}

	if (loadingPayment) {
		return (
			<>
				<Header title="Edit Payment" />
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
			<Header title="Edit Payment" />

			<div className="py-12">
				<div className="max-w-4xl mx-auto px-6 lg:px-8">
					<form onSubmit={onSubmit}>
						<div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 space-y-8">
							{/* Payment Header Info */}
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

								{/* Payment Date Start */}
								<DatePicker
									label="Payment Date"
									value={paymentDate ? new Date(paymentDate) : null}
									onChange={(date) =>
										setPaymentDate(date?.toISOString().split("T")[0] || "")
									}
								/>
								{/* Payment Date End */}
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
									href="/payments"
									icon={<BackSVG />}
									text="cancel"
								/>

								<Btn
									text="Update Payment"
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

export default EditPayment
