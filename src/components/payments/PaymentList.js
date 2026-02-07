import React, { useState, useEffect } from "react"
import Axios from "@/lib/axios"

import Btn from "@/components/ui/button"
import MyLink from "@/components/ui/my-link"
import DeleteModal from "@/components/core/DeleteModal"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { DataTable } from "@/components/ui/data-table"
import Modal from "@/components/ui/modal"
import { format } from "date-fns"

import HeroHeading from "@/components/core/HeroHeading"
import HeroIcon from "@/components/core/HeroIcon"

import ViewSVG from "@/svgs/ViewSVG"
import EditSVG from "@/svgs/EditSVG"
import DeleteSVG from "@/svgs/DeleteSVG"
import PlusSVG from "@/svgs/PlusSVG"
import MoneySVG from "@/svgs/MoneySVG"
import SendEmailSVG from "@/svgs/SendEmailSVG"
import SMSSVG from "@/svgs/SMSSVG"
import ChatSendSVG from "@/svgs/ChatSendSVG"
import PaymentSVG from "@/svgs/PaymentSVG"

const PaymentList = (props) => {
	const [loading, setLoading] = useState()
	const [loadingSMS, setLoadingSMS] = useState()
	const [loadingEmail, setLoadingEmail] = useState()
	const [rowSelection, setRowSelection] = useState({})
	const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
	const [showSendPaymentModal, setShowSendPaymentModal] = useState(false)

	// Timer states
	const [emailCountdown, setEmailCountdown] = useState(0)
	const [smsCountdown, setSmsCountdown] = useState(0)
	const [canSendEmail, setCanSendEmail] = useState(true)
	const [canSendSms, setCanSendSms] = useState(true)

	// Timer effects
	useEffect(() => {
		let timer

		if (emailCountdown > 0) {
			timer = setTimeout(() => {
				setEmailCountdown(emailCountdown - 1)
			}, 1000)
		} else if (emailCountdown === 0 && !canSendEmail) {
			setCanSendEmail(true)
		}

		return () => clearTimeout(timer)
	}, [emailCountdown, canSendEmail])

	useEffect(() => {
		let timer

		if (smsCountdown > 0) {
			timer = setTimeout(() => {
				setSmsCountdown(smsCountdown - 1)
			}, 1000)
		} else if (smsCountdown === 0 && !canSendSms) {
			setCanSendSms(true)
		}

		return () => clearTimeout(timer)
	}, [smsCountdown, canSendSms])

	const [paymentToSend, setPaymentToSend] = useState({})

	/*
	 * Send Email with PDF Attachment
	 */
	const onSendEmail = (paymentId) => {
		if (!canSendEmail || loadingEmail) return

		setLoadingEmail(true)
		setCanSendEmail(false)
		setEmailCountdown(60) // 60 second cooldown

		// Call Laravel endpoint that generates PDF using Browsershot and sends email
		Axios.post(`api/payments/${paymentId}/send-email`)
			.then((res) => {
				setLoadingEmail(false)
				props.setMessages([
					res.data.message ||
						"Payment email sent successfully with PDF attachment",
				])

				// Update the payment emailsSent count if returned
				if (res.data.emailsSent) {
					setPaymentToSend((prev) => ({
						...prev,
						emailsSent: res.data.emailsSent,
					}))

					// Update payment in list
					props.setPayments((prev) => ({
						...prev,
						data: prev.data.map((inv) =>
							inv.id === paymentId
								? { ...inv, emailsSent: res.data.emailsSent }
								: inv
						),
					}))
				}

				// Close Modal
				setShowSendPaymentModal(false)
			})
			.catch((err) => {
				setLoadingEmail(false)
				props.getErrors(err)
				// Reset timer on error
				setCanSendEmail(true)
				setEmailCountdown(0)
			})
	}

	/*
	 * Send SMS
	 */
	const onSendSMS = (paymentId) => {
		if (!canSendSms || loadingSMS) return

		setLoadingSMS(true)
		setCanSendSms(false)
		setSmsCountdown(60) // 60 second cooldown

		Axios.post(`api/payments/send-sms/${paymentId}`)
			.then((res) => {
				setLoadingSMS(false)
				props.setMessages([res.data.message])
				// Close Modal
				setShowSendPaymentModal(false)
			})
			.catch((err) => {
				setLoadingSMS(false)
				props.getErrors(err)
				// Reset timer on error
				setCanSendSms(true)
				setSmsCountdown(0)
			})
	}

	/*
	 * Delete Payment
	 */
	const onDeletePayment = (paymentId) => {
		setLoading(true)
		var paymentIds = Array.isArray(paymentId) ? paymentId.join(",") : paymentId

		Axios.delete(`/api/payments/${paymentIds}`)
			.then((res) => {
				setLoading(false)
				props.setMessages([res.data.message])
				// Remove row
				props.setPayments({
					sum: props.payments.sum,
					meta: props.payments.meta,
					links: props.payments.links,
					data: props.payments.data.filter((payment) => {
						if (Array.isArray(paymentId)) {
							return !paymentId.map(String).includes(String(payment.id))
						} else {
							return payment.id != paymentId
						}
					}),
				})
				setRowSelection({})
			})
			.catch((err) => {
				setLoading(false)
				props.getErrors(err)
				setRowSelection({})
			})
	}

	return (
		<div className={props.activeTab}>
			{/* Bulk Delete Confirmation Modal Start */}
			<Modal
				open={showBulkDeleteDialog}
				onOpenChange={setShowBulkDeleteDialog}
				title="Delete Selected Payments"
				className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-sm rounded-3xl text-white data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top"
				footer={
					<div className="flex justify-between w-full">
						<Btn
							type="button"
							text="Cancel"
							onClick={() => setShowBulkDeleteDialog(false)}
						/>
						<Btn
							icon={<DeleteSVG />}
							text="Delete"
							className="btn-2"
							onClick={() => {
								onDeletePayment(Object.keys(rowSelection))
								setShowBulkDeleteDialog(false)
							}}
							loading={loading}
						/>
					</div>
				}>
				<div className="text-white">
					Are you sure you want to delete {Object.keys(rowSelection).length}{" "}
					selected payment{Object.keys(rowSelection).length > 1 ? "s" : ""}?
					This action cannot be undone.
				</div>
			</Modal>
			{/* Bulk Delete Confirmation Modal End */}

			{/* Send Receipt Modal Start */}
			<Modal
				open={showSendPaymentModal}
				onOpenChange={setShowSendPaymentModal}
				title={`Send Receipt ${paymentToSend.number}`}
				className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-sm rounded-3xl text-white data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top"
				footer={
					<div className="flex justify-between w-full">
						<Btn
							type="button"
							text="Cancel"
							onClick={() => setShowSendPaymentModal(false)}
						/>
						<div className="flex gap-2">
							<Btn
								icon={<SMSSVG />}
								text={
									smsCountdown > 0
										? `Send SMS in ${smsCountdown}s`
										: `Send SMS ${
												paymentToSend.smsesSent
													? `(${paymentToSend.smsesSent})`
													: ""
											}`
								}
								className={`hidden ${
									paymentToSend.smsesSent ? `btn-green` : `btn-2`
								} ${!canSendSms ? "opacity-50 cursor-not-allowed" : ""}`}
								onClick={() => onSendSMS(paymentToSend.id)}
								loading={loadingSMS}
								disabled={!canSendSms || loadingSMS}
							/>
							<Btn
								icon={<SendEmailSVG />}
								text={
									loadingEmail
										? "Generating PDF & Sending..."
										: emailCountdown > 0
											? `Wait ${emailCountdown}s`
											: paymentToSend.emailsSent
												? `Send Email (${paymentToSend.emailsSent} sent)`
												: "Send Email with PDF"
								}
								className={`${
									paymentToSend.emailsSent ? `btn-green` : `btn-2`
								} ${!canSendEmail ? "opacity-50 cursor-not-allowed" : ""}`}
								onClick={() => onSendEmail(paymentToSend.id)}
								loading={loadingEmail}
								disabled={!canSendEmail || loadingEmail}
							/>
						</div>
					</div>
				}>
				<div className="text-white">
					<p className="mb-2">
						Send receipt <strong>{paymentToSend.number}</strong> to{" "}
						<strong>{paymentToSend.clientName}</strong>?
					</p>
					<p className="text-sm text-white/80">
						A PDF receipt will be generated and sent to{" "}
						<strong>{paymentToSend.clientEmail || "the client"}</strong>.
					</p>
				</div>
			</Modal>
			{/* Send Receipt Modal End */}

			{/* Data */}
			<div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-sm rounded-3xl mb-2 p-2 px-5 hover:bg-white/15 transition-all duration-500">
				{/* Total */}
				<div className="grid grid-cols-2 gap-4">
					{/* Count */}
					<div>
						<div className="flex justify-between flex-grow mx-2">
							<HeroHeading
								heading="Count"
								data={
									<span>
										<small>KES</small> {props.payments.meta?.total}
									</span>
								}
							/>
							<HeroIcon>
								<PaymentSVG />
							</HeroIcon>
						</div>
					</div>
					{/* Count End */}
					<div>
						<div className="flex justify-between flex-grow mx-2">
							<HeroHeading
								heading="Total Payments"
								data={
									<span>
										<small>KES</small> {props.payments.sum}
									</span>
								}
							/>
							<HeroIcon>
								<MoneySVG />
							</HeroIcon>
						</div>
					</div>
				</div>
				{/* Total End */}
			</div>
			{/* Data End */}

			<br />

			{/* Filters */}
			<div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-sm rounded-3xl px-4 pt-4 pb-3 mb-2 hover:bg-white/15 transition-all duration-500">
				<div className="flex flex-wrap gap-2">
					{/* Number */}
					<div className="flex-grow min-w-0">
						<Input
							type="text"
							label="Number"
							placeholder="Search by Number"
							value={props.number}
							onChange={(e) => props.setNumber(e.target.value)}
						/>
					</div>
					{/* Number End */}
					{/* Client */}
					<div className="flex-grow min-w-0">
						<Select
							label="Client"
							placeholder=""
							name="client"
							value={props.clientId}
							onChange={(e) => props.setClientId(e.target.value)}
							required>
							<option value=""></option>
							{props.clients.map((client, key) => (
								<option
									key={key}
									value={client.id}>
									{client.name}
								</option>
							))}
						</Select>
					</div>
					{/* Client End */}
					{/* Start Date */}
					<div className="flex flex-grow gap-2">
						<div className="flex-grow">
							{/* Start Month */}
							<Select
								label="Start At"
								value={props.startMonth}
								// placeholder="Select Month"
								onChange={(e) => props.setStartMonth(e.target.value)}
								options={props.months}>
								{props.months.map((month, key) => (
									<option
										key={key}
										value={key}>
										{key == 0 ? "" : month}
									</option>
								))}
							</Select>
						</div>
						{/* Start Month End */}
						{/* Start Year */}
						<div className="flex-grow">
							<Select
								label="Year"
								value={props.startYear}
								onChange={(e) => props.setStartYear(e.target.value)}>
								<option value=""></option>
								{props.years.map((year, key) => (
									<option
										key={key}
										value={year}>
										{year}
									</option>
								))}
							</Select>
						</div>
						{/* Start Year End */}
					</div>
					{/* Start Date End */}
					{/* End Date */}
					<div className="flex flex-grow gap-2">
						{/* End Month */}
						<div className="flex-grow">
							<Select
								label="End At"
								value={props.endMonth}
								onChange={(e) => props.setEndMonth(e.target.value)}>
								{props.months.map((month, key) => (
									<option
										key={key}
										value={key}>
										{key == 0 ? "" : month}
									</option>
								))}
							</Select>
						</div>
						{/* End Month End */}
						{/* End Year */}
						<div className="flex-grow">
							<Select
								label="Year"
								value={props.endYear}
								onChange={(e) => props.setEndYear(e.target.value)}>
								<option value=""></option>
								{props.years.map((year, key) => (
									<option
										key={key}
										value={year}>
										{year}
									</option>
								))}
							</Select>
						</div>
						{/* End Year End */}
					</div>
					{/* End Date End */}
				</div>
			</div>
			{/* Filters End */}

			<br />

			{/* DataTable */}
			<div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-4 mb-5">
				{/* Create Payment Link Start */}
				<div className="flex justify-end gap-2">
					{Object.keys(rowSelection).length > 0 && (
						<Btn
							icon={<DeleteSVG />}
							text={`Delete Selected (${Object.keys(rowSelection).length})`}
							onClick={() => setShowBulkDeleteDialog(true)}
						/>
					)}
					<MyLink
						href={`/payments/create`}
						icon={<PlusSVG />}
						text="create payment"
					/>
				</div>
				{/* Create Payment Link End */}

				<DataTable
					rowSelection={rowSelection}
					setRowSelection={setRowSelection}
					columns={[
						{
							id: "select",
							header: ({ table }) => (
								<input
									type="checkbox"
									checked={table.getIsAllPageRowsSelected()}
									onChange={(e) =>
										table.toggleAllPageRowsSelected(!!e.target.checked)
									}
								/>
							),
							cell: ({ row }) => (
								<input
									type="checkbox"
									checked={row.getIsSelected()}
									onChange={row.getToggleSelectedHandler()}
								/>
							),
							enableSorting: false,
							enableHiding: false,
						},
						{
							accessorKey: "",
							header: "#",
							cell: ({ row }) => (
								<div className="whitespace-nowrap">
									{props.iterator(row.index, props.payments)}
								</div>
							),
						},
						{
							accessorKey: "number",
							header: "Number",
						},
						{
							accessorKey: "invoiceNumber",
							header: "Invoice",
						},
						{
							accessorKey: "clientName",
							header: "Client",
						},
						{
							accessorKey: "amount",
							header: "Amount",
							cell: ({ row }) => (
								<div className="text-green-600 whitespace-nowrap">
									<small>KES</small> {row.getValue("amount")}
								</div>
							),
						},
						{
							accessorKey: "paymentDate",
							header: "Payment Date",
							cell: ({ row }) => (
								<div>{format(row.getValue("paymentDate"), "dd MMM yyyy")}</div>
							),
						},
						{
							id: "actions",
							header: "Action",
							cell: ({ row }) => {
								const payment = row.original
								return (
									<div className="flex items-center gap-2">
										{/* Send Receipt Start */}
										<Btn
											icon={<ChatSendSVG />}
											text={`send receipt ${
												payment.smsesSent || payment.emailsSent
													? `(${payment.smsesSent + payment.emailsSent})`
													: ""
											}`}
											className={`${
												payment.smsesSent || payment.emailsSent
													? "btn-green"
													: ""
											}`}
											onClick={() => {
												setPaymentToSend(payment)
												setShowSendPaymentModal(true)
											}}
										/>
										{/* Send Receipt End */}
										{/* View Start */}
										<MyLink
											href={`/payments/${payment.id}/view`}
											icon={<ViewSVG />}
										/>
										{/* View End */}
										{/* Edit Start */}
										<MyLink
											href={`/payments/${payment.id}/edit`}
											icon={<EditSVG />}
										/>
										{/* Edit End */}
										{/* Delete Start */}
										<DeleteModal
											index={`payment-dt-${payment.id}`}
											model={payment}
											modelName="Payment"
											onDelete={onDeletePayment}
										/>
										{/* Delete End */}
									</div>
								)
							},
						},
					]}
					data={props.payments.data || []}
					pagination={{
						getPaginated: props.getPaginated,
						setState: props.setPayments,
						list: props.payments,
					}}
				/>
			</div>
			{/* DataTable End */}
		</div>
	)
}

export default PaymentList
