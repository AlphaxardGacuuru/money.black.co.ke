"use client"

import { useApp } from "@/contexts/AppContext"
import { useState, useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import Header from "@/app/(app)/Header"
import PaymentList from "@/components/payments/PaymentList"

const Payments = (props) => {
	const appProps = useApp()

	// Add appProps to props
	props = { ...props, ...appProps }

	const [payments, setPayments] = useState([])
	const [clients, setClients] = useState([])

	const [number, setNumber] = useState("")
	const [clientId, setClientId] = useState("")
	const [startMonth, setStartMonth] = useState("")
	const [startYear, setStartYear] = useState("")
	const [endMonth, setEndMonth] = useState("")
	const [endYear, setEndYear] = useState("")

	useEffect(() => {
		// Fetch Payments
		props.getPaginated(
			`payments?number=${number}&
			clientId=${clientId}&
			startMonth=${startMonth}&
			endMonth=${endMonth}&
			startYear=${startYear}&
			endYear=${endYear}`,
			setPayments
		)

		props.get("users?idAndName=true&type=client", setClients)
	}, [number, clientId, startMonth, endMonth, startYear, endYear])

	return (
		<>
			<Header title="Payments" />

			<div className="py-12 px-6">
				{/* Payments Tab */}
				<PaymentList
					{...props}
					payments={payments}
					setPayments={setPayments}
					clients={clients}
					setNumber={setNumber}
					setClientId={setClientId}
					startMonth={startMonth}
					setStartMonth={setStartMonth}
					endMonth={endMonth}
					setEndMonth={setEndMonth}
					startYear={startYear}
					setStartYear={setStartYear}
					endYear={endYear}
					setEndYear={setEndYear}
				/>
				{/* Payments Tab End */}
			</div>
		</>
	)
}

export default Payments
