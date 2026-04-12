"use client"

import React, { useState, useEffect } from "react"
import { useApp } from "@/contexts/AppContext"
import Axios from "@/lib/axios"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { useAuth } from "@/hooks/auth"
import Link from "next/link"

import HeroHeading from "@/components/core/HeroHeading"
import HeroIcon from "@/components/core/HeroIcon"
import MyLink from "@/components/ui/my-link"
import IconDisplay from "@/components/ui/icon-display"
import { Switch } from "@/components/ui/switch"
import DeleteModal from "@/components/core/DeleteModal"

import MoneySVG from "@/svgs/MoneySVG"
import PeopleSVG from "@/svgs/PeopleSVG"
import PlusSVG from "@/svgs/PlusSVG"
import { EditSVG } from "@/svgs"

const Account = () => {
	const appProps = useApp()
	const { user } = useAuth({ middleware: "auth" })

	const [accounts, setAccounts] = useState([])
	const [isDefault, setIsDefault] = useState(true)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		appProps.getPaginated(`accounts?userId=${user?.id}`, setAccounts)
	}, [user])

	/*
	 * Delete Account
	 */
	const onDeleteAccount = (accountId) => {
		setLoading(true)
		var accountIds = Array.isArray(accountId) ? accountId.join(",") : accountId

		Axios.delete(`/api/accounts/${accountIds}`)
			.then((res) => {
				setLoading(false)
				appProps.setMessages([res.data.message])
				// Remove row
				setAccounts({
					meta: accounts.meta,
					links: accounts.links,
					data: accounts.data.filter((account) => {
						if (Array.isArray(accountId)) {
							return !accountIds.map(String).includes(String(account.id))
						} else {
							return account.id != accountId
						}
					}),
				})
			})
			.catch((err) => {
				setLoading(false)
				appProps.getErrors(err)
			})
	}

	return (
		<>
			<div className="max-w-7xl mx-auto px-6 lg:px-8">
				{/* Account Card Start */}
				{accounts.data?.length === 0 ? (
					<div className="flex flex-start gap-4 py-20">
						<HeroIcon color="emerald">
							<MoneySVG />
						</HeroIcon>
						<HeroHeading
							heading="No Accounts Yet"
							data="Get started by creating your first account."
						/>
					</div>
				) : (
					<React.Fragment>
						{accounts.data?.map((account, key) => (
							<Link
								href={`/accounts/${account.id}/edit`}
								key={key}>
								<div
									className={`bg-white/10 backdrop-blur-xl border border-white/20 ${account.isDefault ? "border-4" : ""} shadow-sm rounded-3xl p-6 hover:bg-white/15 transition-all duration-500 mb-4`}>
									<div className="flex justify-start gap-4 items-center mb-4">
										<HeroIcon color={account.color || "purple"}>
											<IconDisplay
												icon={account.icon}
												defaultIcon={PeopleSVG}
											/>
										</HeroIcon>
										<HeroHeading
											heading={account.name}
											data={`${account.currency} ${account.balance}`}
										/>
									</div>
								</div>
							</Link>
						))}
					</React.Fragment>
				)}
				{/* Account Card End */}

				{/* Create Account Link Start */}
				<div className="fixed bottom-20 right-4 z-50">
					<MyLink
						href={`/accounts/create`}
						icon={<PlusSVG />}
						className=""
						size="lg"
					/>
				</div>
				{/* Create Account Link End */}
			</div>
		</>
	)
}

export default Account