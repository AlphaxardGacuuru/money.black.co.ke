"use client"

import { useApp } from "@/contexts/AppContext"
import { useState, useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import Header from "@/app/(app)/Header"
import InvoiceList from "@/components/invoices/InvoiceList"

const Invoices = (props) => {
	const appProps = useApp()

	// Add appProps to props
	props = { ...props, ...appProps }

	const [invoices, setInvoices] = useState([])
	const [clients, setClients] = useState([])

	const [number, setNumber] = useState("")
	const [clientId, setClientId] = useState("")
	const [status, setStatus] = useState("")
	const [startMonth, setStartMonth] = useState("")
	const [startYear, setStartYear] = useState("")
	const [endMonth, setEndMonth] = useState("")
	const [endYear, setEndYear] = useState("")

	useEffect(() => {
		// Fetch Invoices
		props.getPaginated(
			`invoices?number=${number}&
			clientId=${clientId}&
			status=${status}&
			startMonth=${startMonth}&
			endMonth=${endMonth}&
			startYear=${startYear}&
			endYear=${endYear}`,
			setInvoices
		)

		props.get("users?idAndName=true&type=client", setClients)
	}, [
		number,
		clientId,
		status,
		startMonth,
		endMonth,
		startYear,
		endYear,
	])

	return (
		<>
			<Header title="Invoices" />

			<div className="py-12 px-6">
				{/* Invoices Tab */}
				<InvoiceList
					{...props}
					invoices={invoices}
					setInvoices={setInvoices}
					clients={clients}
					setNumber={setNumber}
					setClientId={setClientId}
					setStatus={setStatus}
					setStartMonth={setStartMonth}
					setEndMonth={setEndMonth}
					setStartYear={setStartYear}
					setEndYear={setEndYear}
				/>
				{/* Invoices Tab End */}
			</div>
		</>
	)
}

export default Invoices
