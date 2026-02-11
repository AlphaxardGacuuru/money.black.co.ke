"use client"

import React, { useState, useEffect } from "react"
import { useApp } from "@/contexts/AppContext"
import Axios from "@/lib/axios"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { useAuth } from "@/hooks/auth"

import Header from "@/app/(app)/Header"
import HeroHeading from "@/components/core/HeroHeading"
import HeroIcon from "@/components/core/HeroIcon"
import MyLink from "@/components/ui/my-link"
import IconDisplay from "@/components/ui/icon-display"
import { Switch } from "@/components/ui/switch"
import DeleteModal from "@/components/core/DeleteModal"

import MoneySVG from "@/svgs/MoneySVG"
import PeopleSVG from "@/svgs/PeopleSVG"
import PlusSVG from "@/svgs/PlusSVG"

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
			<Header title="Account" />
			<div className="py-12">
				<div className="max-w-7xl mx-auto px-6 lg:px-8">
					{/* Create Account Link Start */}
					<div className="flex justify-end mb-4">
						<MyLink
							href={`/accounts/create`}
							icon={<PlusSVG />}
							text="create account"
						/>
					</div>
					{/* Create Account Link End */}

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
								<div
									key={key}
									className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-sm rounded-3xl p-6 hover:bg-white/15 transition-all duration-500 mb-4">
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
										{/* Type Start */}
										<div className="capitalize text-white/70 border border-white/20 px-2 py-1 rounded-lg text-xs">
											{account.type}
										</div>
										{/* Type End */}
										<div className="ml-auto text-white/70">
											<div className="flex justify-end mb-4">
												{/* Default Start */}
												<div className="grid grid-cols-1 me-2">
													<FieldGroup className="w-full">
														<Field orientation="horizontal">
															<Switch
																id="switch-size-default"
																size="lg"
																checked={account.isDefault}
																onCheckedChange={setIsDefault}
															/>
														</Field>
													</FieldGroup>
												</div>
												{/* Default End */}
												{/* Edit Account Link Start */}
												<MyLink
													href={`/accounts/${account.id}/edit`}
													icon={<PlusSVG />}
													text="edit account"
													className="me-2"
												/>
												{/* Edit Account Link End */}
												{/* Delete Account Start */}
												<DeleteModal
													index={`account-dt-${account.id}`}
													model={account}
													modelName="Account"
													onDelete={onDeleteAccount}
												/>
												{/* Delete Account End */}
											</div>
										</div>
									</div>
								</div>
							))}
						</React.Fragment>
					)}
					{/* Account Card End */}
				</div>
			</div>
		</>
	)
}

export default Account
