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
import CloseSVG from "@/svgs/CloseSVG"
import PlusSVG from "@/svgs/PlusSVG"
import { DatePicker } from "@/components/ui/date-picker"
import MyLink from "@/components/ui/my-link"

const EditInvoice = ({ params }) => {
	const router = useRouter()
	const appProps = useApp()

	const [clients, setClients] = useState([])
	const [loading, setLoading] = useState(false)
	const [loadingInvoice, setLoadingInvoice] = useState(true)

	// Format currency with commas
	const formatCurrency = (amount) => {
		return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
	}

	// Invoice Details
	const [clientId, setClientId] = useState("")
	const [issueDate, setIssueDate] = useState(
		new Date().toISOString().split("T")[0]
	)
	const [dueDate, setDueDate] = useState("")
	const [notes, setNotes] = useState("")
	const [terms, setTerms] = useState(
		"Payment is due within 30 days of invoice date."
	)

	// Invoice Items
	const [invoiceItems, setInvoiceItems] = useState([
		{ description: "", quantity: 1, rate: 0, amount: 0 },
	])

	// Get data
	useEffect(() => {
		// Fetch Clients
		appProps.get(`users?type=client`, setClients)

		// Fetch Invoice
		Axios.get(`/api/invoices/${params.id}`)
			.then((res) => {
				const invoice = res.data.data
				setClientId(invoice.clientId || "")
				setIssueDate(
					invoice.issueDate || new Date().toISOString().split("T")[0]
				)
				setDueDate(invoice.dueDate || "")
				setNotes(invoice.notes || "")
				setTerms(
					invoice.terms || "Payment is due within 30 days of invoice date."
				)

				// Set invoice items from invoice
				if (invoice.invoiceItems && invoice.invoiceItems.length > 0) {
					const formattedInvoiceItems = invoice.invoiceItems.map((item) => ({
						description: item.description || "",
						quantity: parseFloat(item.quantity) || 1,
						rate: parseFloat(item.rate) || 0,
						amount: parseFloat(item.amount) || 0,
					}))

					setInvoiceItems(formattedInvoiceItems)
				}

				setLoadingInvoice(false)
			})
			.catch(() => {
				setLoadingInvoice(false)
			})
	}, [params.id])

	// Calculate invoice item amount
	const calculateInvoiceItemAmount = (quantity, rate) => {
		return (parseFloat(quantity) || 0) * (parseFloat(rate) || 0)
	}

	// Update invoice item
	const updateInvoiceItem = (index, field, value) => {
		const newInvoiceItems = [...invoiceItems]
		newInvoiceItems[index][field] = value

		// Recalculate amount if quantity or rate changes
		if (field === "quantity" || field === "rate") {
			newInvoiceItems[index].amount = calculateInvoiceItemAmount(
				newInvoiceItems[index].quantity,
				newInvoiceItems[index].rate
			)
		}

		setInvoiceItems(newInvoiceItems)
	}

	// Add invoice item
	const addInvoiceItem = () => {
		setInvoiceItems([
			...invoiceItems,
			{ description: "", quantity: 1, rate: 0, amount: 0 },
		])
	}

	// Remove invoice item
	const removeInvoiceItem = (index) => {
		if (invoiceItems.length > 1) {
			setInvoiceItems(invoiceItems.filter((_, i) => i !== index))
		}
	}

	// Calculate totals
	const calculateSubtotal = () => {
		return invoiceItems.reduce(
			(sum, item) => sum + (parseFloat(item.amount) || 0),
			0
		)
	}

	const calculateTotal = () => {
		return calculateSubtotal()
	}

	/*
	 * Submit Form
	 */
	const onSubmit = (e) => {
		e.preventDefault()
		setLoading(true)

		const invoiceData = {
			clientId,
			issueDate,
			dueDate,
			invoiceItems: invoiceItems.filter(
				(item) => item.description.trim() !== ""
			),
			total: calculateTotal(),
			notes,
			terms,
		}

		Axios.put(`/api/invoices/${params.id}`, invoiceData)
			.then((res) => {
				setLoading(false)
				appProps.setMessages([res.data.message])
				// setTimeout(() => router.push(`/invoices`), 500)
			})
			.catch((err) => {
				setLoading(false)
				appProps.getErrors(err)
			})
	}

	if (loadingInvoice) {
		return (
			<>
				<Header title="Edit Invoice" />
				<div className="py-12">
					<div className="max-w-4xl mx-auto px-6 lg:px-8">
						<div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
							<div className="text-white text-center">Loading invoice...</div>
						</div>
					</div>
				</div>
			</>
		)
	}

	return (
		<>
			<Header title="Edit Invoice" />

			<div className="py-12">
				<div className="max-w-4xl mx-auto px-6 lg:px-8">
					<form onSubmit={onSubmit}>
						<div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 space-y-8">
							{/* Invoice Header Info */}
							{/* Client Selection Start */}
							<div className="grid grid-cols-1 gap-6">
								<Select
									label="Client"
									placeholder=""
									value={clientId}
									onChange={(e) => setClientId(e.target.value)}
									required>
									{clients.map((client, key) => (
										<option
											key={key}
											value={client.id}>
											{client.name}
										</option>
									))}
								</Select>
							</div>
							{/* Client Selection End */}

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{/* Issue Date Start */}
								<DatePicker
									label="Issue Date"
									value={issueDate ? new Date(issueDate) : null}
									onChange={(date) =>
										setIssueDate(date?.toISOString().split("T")[0] || "")
									}
								/>
								{/* Issue Date End */}

								{/* Due Date Start */}
								<DatePicker
									label="Due Date"
									value={dueDate ? new Date(dueDate) : null}
									onChange={(date) =>
										setDueDate(date?.toISOString().split("T")[0] || "")
									}
								/>
								{/* Due Date End */}
							</div>

							{/* Invoice Items Section */}
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<h3 className="text-xl text-white font-light font-nunito">
										Invoice Items
									</h3>
									<Btn
										icon={<PlusSVG />}
										onClick={addInvoiceItem}
										text="Add Item"
									/>
								</div>

								{/* Invoice Items Table */}
								<div className="overflow-x-auto">
									<div className="min-w-full space-y-3">
										{/* Header */}
										<div className="hidden md:grid md:grid-cols-12 gap-3 px-4 py-2 text-white/60 font-light font-nunito text-sm">
											<div className="col-span-5">Description</div>
											<div className="col-span-2">Quantity</div>
											<div className="col-span-2">Rate (KES)</div>
											<div className="col-span-2">Amount (KES)</div>
											<div className="col-span-1"></div>
										</div>

										{/* Invoice Items */}
										{invoiceItems.map((item, index) => (
											<div
												key={index}
												className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-white/5 border border-white/10 rounded-xl">
												{/* Description */}
												<div className="col-span-12 md:col-span-5">
													<Input
														type="text"
														label="Description"
														className="md:hidden"
														value={item.description}
														onChange={(e) =>
															updateInvoiceItem(
																index,
																"description",
																e.target.value
															)
														}
														required
													/>
													<input
														type="text"
														className="hidden md:block w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-light font-nunito focus:outline-none focus:border-white/40 transition-all duration-300"
														placeholder="Web development services..."
														value={item.description}
														onChange={(e) =>
															updateInvoiceItem(
																index,
																"description",
																e.target.value
															)
														}
														required
													/>
												</div>

												{/* Quantity */}
												<div className="col-span-6 md:col-span-2">
													<Input
														type="number"
														label="Quantity"
														className="md:hidden"
														min="0"
														step="0.01"
														value={item.quantity}
														onChange={(e) =>
															updateInvoiceItem(
																index,
																"quantity",
																e.target.value
															)
														}
														required
													/>
													<input
														type="number"
														min="0"
														step="0.01"
														className="hidden md:block w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-light font-nunito focus:outline-none focus:border-white/40 transition-all duration-300"
														value={item.quantity}
														onChange={(e) =>
															updateInvoiceItem(
																index,
																"quantity",
																e.target.value
															)
														}
														required
													/>
												</div>

												{/* Rate */}
												<div className="col-span-6 md:col-span-2">
													<Input
														type="number"
														label="Rate"
														className="md:hidden"
														min="0"
														step="0.01"
														value={item.rate}
														onChange={(e) =>
															updateInvoiceItem(index, "rate", e.target.value)
														}
														required
													/>
													<input
														type="number"
														min="0"
														step="0.01"
														className="hidden md:block w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-light font-nunito focus:outline-none focus:border-white/40 transition-all duration-300"
														value={item.rate}
														onChange={(e) =>
															updateInvoiceItem(index, "rate", e.target.value)
														}
														required
													/>
												</div>

												{/* Amount */}
												<div className="col-span-10 md:col-span-2">
													<label className="block md:hidden text-white/60 font-light font-nunito text-sm mb-1">
														Amount
													</label>
													<div className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white/80 font-light font-nunito">
														{formatCurrency(item.amount)}
													</div>
												</div>

												{/* Remove Button */}
												<div className="col-span-2 md:col-span-1 flex items-end md:items-center justify-end">
													<button
														type="button"
														onClick={() => removeInvoiceItem(index)}
														disabled={invoiceItems.length === 1}
														className="p-2 text-white/60 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
														<CloseSVG />
													</button>
												</div>
											</div>
										))}
									</div>
								</div>
							</div>

							{/* Totals Section */}
							<div className="flex justify-end">
								<div className="w-full md:w-96 space-y-3">
									{/* Total */}
									<div className="flex justify-between items-center px-4 py-3 bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-xl">
										<span className="text-white font-nunito text-lg">
											Total:
										</span>
										<span className="text-white font-nunito text-xl font-medium">
											KES {formatCurrency(calculateTotal())}
										</span>
									</div>
								</div>
							</div>

							{/* Notes and Terms Start */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{/* Notes */}
								<Textarea
									label="Notes"
									rows={4}
									placeholder="Additional notes or comments..."
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
								/>

								{/* Terms */}
								<Textarea
									label="Terms & Conditions"
									rows={4}
									placeholder="Payment terms..."
									value={terms}
									onChange={(e) => setTerms(e.target.value)}
								/>
							</div>
							{/* Notes and Terms End */}

							{/* Action Buttons */}
							<div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
								<MyLink
									href="/invoices"
									icon={<BackSVG />}
									text="cancel"
								/>

								<Btn
									text="Update Invoice"
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

export default EditInvoice
