import React, { useState } from "react"

import Btn from "@/components/ui/button"
import Modal from "@/components/ui/modal"

import DeleteSVG from "@/svgs/DeleteSVG"

const DeleteModal = ({ index, model, modelName, onDelete }) => {
	const [open, setOpen] = useState(false)

	const handleDelete = () => {
		onDelete(model.id)
		setOpen(false)
	}

	return (
		<React.Fragment>
			{/* Delete Modal */}
			<Modal
				open={open}
				onOpenChange={setOpen}
				title={`Delete ${modelName}`}
				className="bg-red-600 text-white border-red-600 data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top"
				footer={
					<div className="flex justify-between w-full">
						<Btn
							type="button"
							text="Cancel"
							onClick={() => setOpen(false)}
						/>
						<Btn
							icon={<DeleteSVG />}
							text="Delete"
							className="btn-2"
							onClick={handleDelete}
						/>
					</div>
				}>
				<div className="text-white">
					Are you sure you want to delete {model.name ?? modelName}? All
					associated data will be lost.
				</div>
			</Modal>
			{/* Delete Modal End */}

			{/* Button trigger modal */}
			<Btn
				icon={<DeleteSVG />}
				text="delete"
				onClick={() => setOpen(true)}
			/>
			{/* Button trigger modal End */}
		</React.Fragment>
	)
}

export default DeleteModal
