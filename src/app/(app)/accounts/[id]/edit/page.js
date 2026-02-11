"use client"

import React, { useEffect, useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation" // Added useParams
import { useApp } from "@/contexts/AppContext"
import Axios from "@/lib/axios"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"

import Header from "@/app/(app)/Header"
import Btn from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

import BackSVG from "@/svgs/BackSVG"
import UpdateSVG from "@/svgs/PlusSVG" // You might want to rename this icon
import MyLink from "@/components/ui/my-link"
import IconInput from "@/components/ui/IconInput"

const EditAccount = (props) => {
	const router = useRouter()
	const params = useParams() // Extract ID from URL
	const appProps = useApp()

	props = { ...props, ...appProps }

	const [loading, setLoading] = useState(false)
	const [fetching, setFetching] = useState(true)

	// State
	const [name, setName] = useState("")
	const [icon, setIcon] = useState("")
	const [color, setColor] = useState("#000000")
	const [type, setType] = useState("")
	const [description, setDescription] = useState("")
	const [currency, setCurrency] = useState("KES")
	const [isDefault, setIsDefault] = useState(false)

	useEffect(() => {
		Axios.get(`/api/accounts/${params.id}`)
			.then((res) => {
				const account = res.data.data
				setName(account.name)
				setIcon(account.icon)
				setColor(account.color)
				setType(account.type)
				setDescription(account.description || "")
				setCurrency(account.currency)
				setIsDefault(account.isDefault)
				setFetching(false)
			})
			.catch((err) => {
				props.getErrors(err)
				setFetching(false)
			})
	}, [])

	/*
	 * Submit Form (Update)
	 */
	const onSubmit = (e) => {
		e.preventDefault()
		setLoading(true)

		const accountData = {
			name,
			icon,
			color,
			type,
			description,
			currency,
			is_default: isDefault,
		}

		// Changed to PUT and added ID to endpoint
		Axios.put(`/api/accounts/${params.id}`, accountData)
			.then((res) => {
				setLoading(false)
				props.setMessages([res.data.message])
			})
			.catch((err) => {
				setLoading(false)
				props.getErrors(err)
			})
	}

	if (fetching) {
		return <Header title="Loading Account..." />
	}

	return (
		<>
			<Header title="Edit Account" />

			<div className="py-12">
				<div className="max-w-4xl mx-auto px-6 lg:px-8">
					<form onSubmit={onSubmit}>
						<div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 space-y-8 shadow-2xl">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<IconInput
									value={icon}
									onChange={setIcon}
								/>
								<Input
									label="Color"
									type="color"
									value={color}
									onChange={(e) => setColor(e.target.value)}
									required
								/>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-1 gap-6">
								<Input
									label="Name"
									placeholder="e.g., Equity Bank, M-Pesa Business"
									value={name} // Uncommented value
									onChange={(e) => setName(e.target.value)}
									required
								/>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<Select
									label="Currency"
									value={currency}
									onChange={(e) => setCurrency(e.target.value)}>
									<option value="KES">KES</option>
									<option value="USD">USD</option>
								</Select>

								<Select
									label="Type"
									value={type}
									onChange={(e) => setType(e.target.value)}>
									<option value=""></option>
									<option value="regular">Regular</option>
									<option value="savings">Savings</option>
									<option value="mobile">Mobile</option>
								</Select>
							</div>

							<Textarea
								label="Description"
								rows={3}
								placeholder="Optional details about this account..."
								value={description}
								onChange={(e) => setDescription(e.target.value)}
							/>

							<div className="grid grid-cols-1">
								<FieldGroup className="w-full">
									<Field orientation="horizontal">
										<Switch
											id="switch-size-default"
											size="lg"
											checked={isDefault}
											onCheckedChange={setIsDefault}
										/>
										<FieldLabel
											htmlFor="switch-size-default"
											className="text-white">
											Set as Default Account
										</FieldLabel>
									</Field>
								</FieldGroup>
							</div>

							<div className="flex flex-col sm:flex-row justify-between items-center gap-4">
								<MyLink
									href="/accounts"
									icon={<BackSVG />}
									text="Back to Accounts"
								/>

								<Btn
									text="Update Account" // Changed Label
									loading={loading}
									icon={<UpdateSVG />}
								/>
							</div>
						</div>
					</form>
				</div>
			</div>
		</>
	)
}

export default EditAccount
