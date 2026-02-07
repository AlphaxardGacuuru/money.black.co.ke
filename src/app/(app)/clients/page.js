"use client"

import { useApp } from "@/contexts/AppContext"
import { useState, useEffect } from "react"
import Header from "@/app/(app)/Header"
import ClientList from "@/components/clients/ClientList"

const Clients = (props) => {
	const appProps = useApp()

	// Add appProps to props
	props = { ...props, ...appProps }

	const [clients, setClients] = useState([])

	const [name, setName] = useState("")
	const [email, setEmail] = useState("")
	const [phone, setPhone] = useState("")

	useEffect(() => {
		// Fetch Clients
		props.getPaginated(
			`users?type=client&
			name=${name}&
			email=${email}&
			phone=${phone}`,
			setClients
		)
	}, [name, email, phone])

	return (
		<>
			<Header title="Clients" />
			
			<div className="py-12 px-6">
				{/* Clients Tab */}
				<ClientList
					{...props}
					clients={clients}
					setClients={setClients}
					name={name}
					setName={setName}
					email={email}
					setEmail={setEmail}
					phone={phone}
					setPhone={setPhone}
				/>
			</div>
		</>
	)
}

export default Clients
