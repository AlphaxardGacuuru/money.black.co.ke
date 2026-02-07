import React, { useState, useRef } from "react"
import Axios from "@/lib/axios"

import Btn from "@/components/ui/button"
import MyLink from "@/components/ui/my-link"
import DeleteModal from "@/components/core/DeleteModal"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { DataTable } from "@/components/ui/data-table"
import Modal from "@/components/ui/modal"

import HeroHeading from "@/components/core/HeroHeading"
import HeroIcon from "@/components/core/HeroIcon"

import ViewSVG from "@/svgs/ViewSVG"
import EditSVG from "@/svgs/EditSVG"
import DeleteSVG from "@/svgs/DeleteSVG"
import PlusSVG from "@/svgs/PlusSVG"
import MoneySVG from "@/svgs/MoneySVG"
import DeductionSVG from "@/svgs/DeductionSVG"

const DeductionList = (props) => {
	const [loading, setLoading] = useState()
	const [rowSelection, setRowSelection] = useState({})
	const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)

	/*
	 * Delete Deduction
	 */
	const onDeleteDeduction = (deductionId) => {
		setLoading(true)
		var deductionIds = Array.isArray(deductionId)
			? deductionId.join(",")
			: deductionId

		Axios.delete(`/api/deductions/${deductionIds}`)
			.then((res) => {
				setLoading(false)
				props.setMessages([res.data.message])
				// Remove row
				props.setDeductions({
					sum: props.deductions.sum,
					meta: props.deductions.meta,
					links: props.deductions.links,
					data: props.deductions.data.filter((deduction) => {
						if (Array.isArray(deductionId)) {
							return !deductionId.map(String).includes(String(deduction.id))
						} else {
							return deduction.id != deductionId
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
				title="Delete Selected Deductions"
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
								onDeleteDeduction(Object.keys(rowSelection))
								setShowBulkDeleteDialog(false)
							}}
							loading={loading}
						/>
					</div>
				}>
				<div className="text-white">
					Are you sure you want to delete {Object.keys(rowSelection).length}{" "}
					selected deduction{Object.keys(rowSelection).length > 1 ? "s" : ""}?
					This action cannot be undone.
				</div>
			</Modal>
			{/* Bulk Delete Confirmation Modal End */}

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
										<small>KES</small> {props.deductions.meta?.total}
									</span>
								}
							/>
							<HeroIcon>
								<DeductionSVG />
							</HeroIcon>
						</div>
					</div>
					{/* Count End */}
					{/* Total */}
					<div>
						<div className="flex justify-between flex-grow mx-2">
							<HeroHeading
								heading="Total"
								data={
									<span>
										<small>KES</small> {props.deductions.sum}
									</span>
								}
							/>
							<HeroIcon>
								<MoneySVG />
							</HeroIcon>
						</div>
					</div>
					{/* Total End */}
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
					{/* Status */}
					<div className="flex-grow min-w-0">
						<Select
							label="Status"
							placeholder=""
							name="status"
							value={props.status}
							onChange={(e) => props.setStatus(e.target.value)}
							required>
							{[
								{ id: "", name: "" },
								{ id: "not_paid", name: "Not Paid" },
								{ id: "partially_paid", name: "Partially Paid" },
								{ id: "paid", name: "Paid" },
								{ id: "overpaid", name: "Overpaid" },
							].map((client, key) => (
								<option
									key={key}
									value={client.id}>
									{client.name}
								</option>
							))}
						</Select>
					</div>
					{/* Status End */}

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

			{/* Data */}
			<div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-4 mb-5">
				{/* Create Deduction Link Start */}
				<div className="flex justify-end gap-2">
					{Object.keys(rowSelection).length > 0 && (
						<Btn
							icon={<DeleteSVG />}
							text={`Delete Selected (${Object.keys(rowSelection).length})`}
							onClick={() => setShowBulkDeleteDialog(true)}
						/>
					)}
					<MyLink
						href={`/deductions/create`}
						icon={<PlusSVG />}
						text="create deduction"
					/>
				</div>
				{/* Create Deduction Link End */}

				{/* DataTable Start */}
				<DataTable
					columns={[
						{
							id: "select",
							header: ({ table }) => (
								<input
									type="checkbox"
									checked={table.getIsAllPageRowsSelected()}
									onChange={table.getToggleAllPageRowsSelectedHandler()}
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
									{props.iterator(row.index, props.deductions)}
								</div>
							),
						},
						{
							accessorKey: "number",
							header: "Number",
							cell: ({ row }) => (
								<div className="whitespace-nowrap">
									{row.getValue("number")}
								</div>
							),
						},
						{
							accessorKey: "clientName",
							header: "Client",
						},
						{
							accessorKey: "invoiceNumber",
							header: "Invoice",
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
							accessorKey: "issueDate",
							header: "Issue Date",
						},
						{
							id: "actions",
							header: "Action",
							cell: ({ row }) => {
								const deduction = row.original
								return (
									<div className="flex items-center gap-2">
										<MyLink
											href={`/deductions/${deduction.id}/view`}
											icon={<ViewSVG />}
											// text="view"
										/>
										<MyLink
											href={`/deductions/${deduction.id}/edit`}
											icon={<EditSVG />}
											// text="edit"
										/>
										<DeleteModal
											index={`deduction-dt-${deduction.id}`}
											model={deduction}
											modelName="Deduction"
											onDelete={onDeleteDeduction}
										/>
									</div>
								)
							},
						},
					]}
					data={props.deductions.data || []}
					pagination={{
						getPaginated: props.getPaginated,
						setState: props.setDeductions,
						list: props.deductions,
					}}
					rowSelection={rowSelection}
					setRowSelection={setRowSelection}
				/>
			</div>
			{/* DataTable End */}
		</div>
	)
}

export default DeductionList
