"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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
import PlusSVG from "@/svgs/PlusSVG"
import MyLink from "@/components/ui/my-link"
import IconInput from "@/components/ui/IconInput"

const CreateAccount = (props) => {
	const router = useRouter()
	const appProps = useApp()

	props = { ...props, ...appProps }

	const [loading, setLoading] = useState(false)

	// Account Migration Fields State
	const [name, setName] = useState()
	const [icon, setIcon] = useState()
	const [color, setColor] = useState("#000000")
	const [type, setType] = useState()
	const [description, setDescription] = useState()
	const [currency, setCurrency] = useState("KES")
	const [isDefault, setIsDefault] = useState(true)

	/*
	 * Submit Form
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

		// Updated endpoint to /api/accounts
		Axios.post("/api/accounts", accountData)
			.then((res) => {
				setLoading(false)
				props.setMessages([res.data.message])
				setTimeout(() => router.push(`/accounts`), 500)
			})
			.catch((err) => {
				setLoading(false)
				props.getErrors(err)
			})
	}

	return (
		<>
			<Header title="Create Account" />

			<div className="py-6">
				<div className="max-w-4xl mx-auto px-6 lg:px-8">
					<form onSubmit={onSubmit}>
						<div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 space-y-8 shadow-2xl">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{/* Icon Start */}
								<IconInput
									value={icon}
									onChange={setIcon}
								/>
								{/* Icon End */}

								{/* Color Start */}
								<Input
									label="Color"
									type="color"
									value={color}
									onChange={(e) => setColor(e.target.value)}
									required
								/>
								{/* Color End */}
							</div>

							<div className="grid grid-cols-1 md:grid-cols-1 gap-6">
								{/* Name Start */}
								<Input
									label="Name"
									placeholder="e.g., Equity Bank, M-Pesa Business"
									// value={name}
									onChange={(e) => setName(e.target.value)}
									required
								/>
								{/* Name End */}
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{/* Currency Start */}
								<Select
									label="Currency"
									value={currency}
									onChange={(e) => setCurrency(e.target.value)}>
									<option value="KES">KES</option>
								</Select>
								{/* Currency End */}

								{/* Type Start */}
								<Select
									label="Type"
									value={type}
									onChange={(e) => setType(e.target.value)}>
									<option value=""></option>
									<option value="regular">Regular</option>
									<option value="savings">Savings</option>
									<option value="mobile">Mobile</option>
								</Select>
								{/* Type End */}
							</div>

							{/* Description Start */}
							<Textarea
								label="Description"
								rows={3}
								placeholder="Optional details about this account..."
								value={description}
								onChange={(e) => setDescription(e.target.value)}
							/>
							{/* Description End */}

							{/* Default Start */}
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
							{/* Default End */}

							<div className="flex flex-col sm:flex-row justify-between items-center gap-4">
								<MyLink
									href="/accounts"
									icon={<BackSVG />}
									text="Back to Accounts"
								/>

								<Btn
									text="Create Account"
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

export default CreateAccount