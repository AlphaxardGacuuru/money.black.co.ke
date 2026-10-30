import { Link } from "@/components/ui/link"
import { Head } from "@/lib/spa"
import { ChevronRight, Plus, Star, Wallet } from "lucide-react"
import Heading from "@/components/heading"
import LucideIconDisplay from "@/components/lucide-icon-display"
import { useInitials } from "@/hooks/use-initials"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useFabPosition } from "@/hooks/use-fab-position"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { PlaceholderPattern } from "@/components/ui/placeholder-pattern"
import { useApp } from "@/contexts/AppContext"
import { useEffect } from "react"

export default function AccountsIndex() {
	const props = useApp()

	const getInitials = useInitials()
	const fabPosition = useFabPosition()

	useEffect(() => {
		props.get("accounts", props.setAccounts, "accounts")
	}, [])

	return (
		<>
			<Head title="Accounts" />

			{/* Floating Section Start */}
			<div {...fabPosition}>
				<Button
					asChild
					className="h-14 min-w-14 rounded-full px-4 shadow-lg sm:px-6">
					<Link
						href="/accounts/create"
						variant="unstyled"
						aria-label="Create account"
						title="Create account">
						<Plus
							className="size-8"
							strokeWidth={1.3}
						/>
						<span className="hidden sm:inline">Create account</span>
					</Link>
				</Button>
			</div>
			{/* Floating Section End */}

			{/* Bottom padding keeps the last account clear of the floating button. */}
			<div className="flex flex-1 flex-col gap-2 pb-32 md:pb-24">
				{/* Page Header Section Start */}
				<div className="relative overflow-hidden rounded-2xl border bg-card px-4 py-4 shadow-xs sm:px-5">
					<div className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/8 via-transparent to-transparent" />

					<div className="relative">
						<Heading
							title="Accounts"
							description="Track the wallets, banks, and cash accounts that power the rest of your bookkeeping."
						/>
					</div>
				</div>
				{/* Page Header Section End */}

				{/* Accounts Content Section Start */}
				<div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
					{props.accounts.length > 0 ? (
						/* Account Cards Section Start */
						props.accounts.map((account) => (
							<Link
								key={account.id}
								href={`/accounts/${account.id}/edit`}
								variant="unstyled"
								size="none"
								className="group block">
								<Card
									className={`h-full transition-colors group-hover:bg-accent/20 ${account.isDefault ? "border-2 border-primary/60 group-hover:border-primary" : "border-border/80 group-hover:border-primary/40"}`}>
									<CardHeader className="gap-4">
										<div className="flex items-start justify-between gap-4">
											<div className="flex items-center gap-4">
												<div
													className="flex size-12 items-center justify-center rounded-xl border border-border/60 text-white shadow-sm"
													style={{
														backgroundColor: account.color ?? "#0f172a",
													}}>
													<LucideIconDisplay
														icon={account.icon}
														className="size-5"
														fallback={
															<span className="text-sm font-semibold">
																{getInitials(account.name) || "A"}
															</span>
														}
													/>
												</div>

												<div className="space-y-1">
													<CardTitle className="flex items-center gap-2">
														{account.name}
													</CardTitle>
													<CardDescription>
														{account.description || "No description added yet."}
													</CardDescription>
												</div>
											</div>

											<ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
										</div>
									</CardHeader>

									<CardContent className="space-y-4">
										<div className="flex flex-wrap items-center gap-2">
											<Badge variant="secondary">
												{account.currency ?? "KES"}
											</Badge>
											{account.type ? (
												<Badge
													variant="outline"
													className="capitalize">
													{account.type}
												</Badge>
											) : null}
											{account.isDefault ? (
												<Badge className="gap-1">
													<Star className="size-2.5 fill-current" />
													Default
												</Badge>
											) : null}
										</div>

										<div className="rounded-lg border border-border/70 bg-muted/40 px-4 py-3">
											<p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
												Balance
											</p>
											<p className="mt-2 text-2xl font-semibold tracking-tight">
												{account.currency ?? "KES"} {account.balance?.formatted}
											</p>
										</div>
									</CardContent>
								</Card>
							</Link>
						))
					) : (
						/* Account Cards Section End */
						/* Empty State Section Start */
						<Card className="relative overflow-hidden border-dashed md:col-span-2 xl:col-span-3">
							<PlaceholderPattern className="absolute inset-0 size-full stroke-muted-foreground/15" />
							<CardContent className="relative flex min-h-72 flex-col items-center justify-center gap-4 text-center">
								<div className="flex size-14 items-center justify-center rounded-full border bg-background shadow-sm">
									<Wallet className="size-6 text-muted-foreground" />
								</div>
								<div className="space-y-2">
									<h2 className="text-lg font-semibold">No accounts yet</h2>
									<p className="max-w-md text-sm text-muted-foreground">
										Create your first account to start tracking balances,
										defaults, and account-specific activity inside the app.
									</p>
								</div>
							</CardContent>
						</Card>
						/* Empty State Section End */
					)}
				</div>
				{/* Accounts Content Section End */}
			</div>
		</>
	)
}

AccountsIndex.layout = {
	breadcrumbs: [
		{
			title: "Accounts",
			href: "/accounts",
		},
	],
}
