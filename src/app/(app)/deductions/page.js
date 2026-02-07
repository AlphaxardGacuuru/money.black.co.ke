"use client"

import { useApp } from "@/contexts/AppContext"
import { useState, useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import Header from "@/app/(app)/Header"
import DeductionList from "@/components/deductions/DeductionList"

const Deductions = (props) => {
	const appProps = useApp()

	// Add appProps to props
	props = { ...props, ...appProps }

	const [deductions, setDeductions] = useState([])
	const [clients, setClients] = useState([])

	const [number, setNumber] = useState("")
	const [clientId, setClientId] = useState("")
	const [clientName, setClientName] = useState("")
	const [status, setStatus] = useState("")
	const [startMonth, setStartMonth] = useState("")
	const [startYear, setStartYear] = useState("")
	const [endMonth, setEndMonth] = useState("")
	const [endYear, setEndYear] = useState("")

	useEffect(() => {
		// Fetch Deductions
		props.getPaginated(
			`deductions?
			number=${number}&
			clientId=${clientId}&
			status=${status}&
			startMonth=${startMonth}&
			endMonth=${endMonth}&
			startYear=${startYear}&
			endYear=${endYear}`,
			setDeductions
		)

		props.get("users?idAndName=true&type=client", setClients)
	}, [
		number,
		clientId,
		clientName,
		status,
		startMonth,
		endMonth,
		startYear,
		endYear,
	])

	return (
		<>
			<Header title="Deductions" />

			<div className="py-12 px-6">
				{/* Deductions Tab */}
				<DeductionList
					{...props}
					deductions={deductions}
					setDeductions={setDeductions}
					clients={clients}
					setNumber={setNumber}
					setClientId={setClientId}
					status={status}
					setStatus={setStatus}
					startMonth={startMonth}
					setStartMonth={setStartMonth}
					endMonth={endMonth}
					setEndMonth={setEndMonth}
					startYear={startYear}
					setStartYear={setStartYear}
					endYear={endYear}
					setEndYear={setEndYear}
				/>
			</div>
		</>
	)
}

export default Deductions
