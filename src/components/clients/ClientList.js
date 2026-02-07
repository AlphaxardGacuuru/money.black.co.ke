import React, { useState } from "react"
import Axios from "@/lib/axios"

import Btn from "@/components/ui/button"
import MyLink from "@/components/ui/my-link"
import DeleteModal from "@/components/core/DeleteModal"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import Modal from "@/components/ui/modal"

import HeroHeading from "@/components/core/HeroHeading"
import HeroIcon from "@/components/core/HeroIcon"

import ViewSVG from "@/svgs/ViewSVG"
import EditSVG from "@/svgs/EditSVG"
import DeleteSVG from "@/svgs/DeleteSVG"
import PlusSVG from "@/svgs/PlusSVG"
import PeopleSVG from "@/svgs/PeopleSVG"

const ClientList = (props) => {
	const [loading, setLoading] = useState(false)
	const [rowSelection, setRowSelection] = useState({})
	const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)

	/*
	 * Delete Client
	 */
	const onDeleteClient = (clientId) => {
		setLoading(true)
		var clientIds = Array.isArray(clientId) ? clientId.join(",") : clientId

		Axios.delete(`/api/clients/${clientIds}`)
			.then((res) => {
				setLoading(false)
				props.setMessages([res.data.message])
				// Remove row
				props.setClients({
					meta: props.clients.meta,
					links: props.clients.links,
					data: props.clients.data.filter((client) => {
						if (Array.isArray(clientId)) {
							return !clientId.map(String).includes(String(client.id))
						} else {
							return client.id != clientId
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
				title="Delete Selected Clients"
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
								onDeleteClient(Object.keys(rowSelection))
								setShowBulkDeleteDialog(false)
							}}
							loading={loading}
						/>
					</div>
				}>
				<div className="text-white">
					Are you sure you want to delete {Object.keys(rowSelection).length}{" "}
					selected client{Object.keys(rowSelection).length > 1 ? "s" : ""}? This
					action cannot be undone.
				</div>
			</Modal>
			{/* Bulk Delete Confirmation Modal End */}

			{/* Data */}
			<div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-sm rounded-3xl mb-2 p-2 px-5 hover:bg-white/15 transition-all duration-500">
				{/* Total */}
				<div className="grid grid-cols-1 gap-4">
					{/* Total */}
					<div>
						<div className="flex justify-between flex-grow mx-2">
							<HeroHeading
								heading="Total Clients"
								data={props.clients.meta?.total || 0}
							/>
							<HeroIcon>
								<PeopleSVG />
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
					{/* Name */}
					<div className="flex-grow min-w-0">
						<Input
							type="text"
							label="Name"
							placeholder="Search by name"
							// value={props.name}
							onChange={(e) => props.setName(e.target.value)}
						/>
					</div>
					{/* Name End */}

					{/* Email */}
					<div className="flex-grow min-w-0">
						<Input
							type="text"
							label="Email"
							placeholder="Search by email"
							// value={props.email}
							onChange={(e) => props.setEmail(e.target.value)}
						/>
					</div>
					{/* Email End */}

					{/* Phone */}
					<div className="flex-grow min-w-0">
						<Input
							type="text"
							label="Phone"
							placeholder="Search by phone"
							// value={props.phone}
							onChange={(e) => props.setPhone(e.target.value)}
						/>
					</div>
					{/* Phone End */}
				</div>
			</div>
			{/* Filters End */}

			<br />

			{/* Data */}
			<div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-4 mb-5">
				{/* Create Client Link Start */}
				<div className="flex justify-end gap-2">
					{Object.keys(rowSelection).length > 0 && (
						<Btn
							icon={<DeleteSVG />}
							text={`Delete Selected (${Object.keys(rowSelection).length})`}
							onClick={() => setShowBulkDeleteDialog(true)}
						/>
					)}
					<MyLink
						href={`/clients/create`}
						icon={<PlusSVG />}
						text="create client"
					/>
				</div>
				{/* Create Client Link End */}

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
									{props.iterator(row.index, props.clients)}
								</div>
							),
						},
						{
							accessorKey: "name",
							header: "Name",
							cell: ({ row }) => (
								<div className="whitespace-nowrap font-semibold">
									{row.getValue("name")}
								</div>
							),
						},
						{
							accessorKey: "email",
							header: "Email",
						},
						{
							accessorKey: "phone",
							header: "Phone",
						},
						{
							id: "actions",
							header: "Action",
							cell: ({ row }) => {
								const client = row.original
								return (
									<div className="flex items-center gap-2">
										<MyLink
											href={`/clients/${client.id}/view`}
											icon={<ViewSVG />}
											// text="view"
										/>
										<MyLink
											href={`/clients/${client.id}/edit`}
											icon={<EditSVG />}
											// text="edit"
										/>
										<DeleteModal
											index={`client-dt-${client.id}`}
											model={client}
											modelName="Client"
											onDelete={onDeleteClient}
										/>
									</div>
								)
							},
						},
					]}
					data={props.clients.data || []}
					pagination={{
						getPaginated: props.getPaginated,
						setState: props.setClients,
						list: props.clients,
					}}
					rowSelection={rowSelection}
					setRowSelection={setRowSelection}
				/>
			</div>
			{/* DataTable End */}
		</div>
	)
}

export default ClientList
