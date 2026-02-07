"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useApp } from "@/contexts/AppContext"
import Axios from "@/lib/axios"

import Header from "@/app/(app)/Header"
import Btn from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import BackSVG from "@/svgs/BackSVG"
import MyLink from "@/components/ui/my-link"

const EditClient = ({ params }) => {
	const router = useRouter()
	const appProps = useApp()

	const [loading, setLoading] = useState(false)
	const [loadingClient, setLoadingClient] = useState(true)

	// Client Details
	const [name, setName] = useState("")
	const [email, setEmail] = useState("")
	const [phone, setPhone] = useState("")

	// Get data
	useEffect(() => {
		// Fetch Client
		Axios.get(`/api/users/${params.id}`)
			.then((res) => {
				const client = res.data.data

				setName(client.name || "")
				setEmail(client.email || "")
				setPhone(client.phone || "")

				setLoadingClient(false)
			})
			.catch((err) => {
				appProps.getErrors(err)
				setLoadingClient(false)
			})
	}, [params.id])

	/*
	 * Submit Form
	 */
	const onSubmit = (e) => {
		e.preventDefault()
		setLoading(true)

		const clientData = {
			name,
			email,
			phone,
		}

		Axios.put(`/api/users/${params.id}`, clientData)
			.then((res) => {
				setLoading(false)
				appProps.setMessages([res.data.message])
				// setTimeout(() => router.push(`/clients`), 500)
			})
			.catch((err) => {
				setLoading(false)
				appProps.getErrors(err)
			})
	}

	if (loadingClient) {
		return (
			<>
				<Header title="Edit Client" />
				<div className="py-12">
					<div className="max-w-4xl mx-auto px-6 lg:px-8">
						<div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
							<div className="text-white text-center">Loading client...</div>
						</div>
					</div>
				</div>
			</>
		)
	}

	return (
		<>
			<Header title="Edit Client" />

			<div className="py-12">
				<div className="max-w-4xl mx-auto px-6 lg:px-8">
					<form onSubmit={onSubmit}>
						<div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 space-y-8">
							{/* Basic Information */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{/* Name Start */}
								<Input
									type="text"
									label="Name"
									placeholder="Client name"
									value={name}
									onChange={(e) => setName(e.target.value)}
									required
								/>
								{/* Name End */}

								{/* Email Start */}
								<Input
									type="email"
									label="Email"
									placeholder="client@example.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									disabled
								/>
								{/* Email End */}
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{/* Phone Start */}
								<Input
									type="tel"
									label="Phone"
									placeholder="+254712345678"
									value={phone}
									onChange={(e) => setPhone(e.target.value)}

								/>
								{/* Phone End */}
							</div>

							{/* Action Buttons */}
							<div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
								<MyLink
									href="/clients"
									icon={<BackSVG />}
									text="cancel"
								/>

								<Btn
									text="Update Client"
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

export default EditClient
