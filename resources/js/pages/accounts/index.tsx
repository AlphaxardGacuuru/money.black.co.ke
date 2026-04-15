import { Head, Link } from "@inertiajs/react"
import { ChevronRight, Plus, Star, Wallet } from "lucide-react"
import AccountController from "@/actions/App/Http/Controllers/AccountController"
import type { AccountPageProps } from "@/types/account"
import Heading from "@/components/heading"
import LucideIconDisplay from "@/components/lucide-icon-display"
import { useInitials } from "@/hooks/use-initials"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { PlaceholderPattern } from "@/components/ui/placeholder-pattern"

export default function AccountsIndex({ accounts }: AccountPageProps) {
	const getInitials = useInitials()

	return (
		<>
			<Head title="Accounts" />

			<div className="flex flex-1 flex-col gap-6 p-4">
				{/* Page Header Section Start */}
				<div className="flex flex-col rounded-xl border bg-card p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between">
					<Heading
						title="Accounts"
						description="Track the wallets, banks, and cash accounts that power the rest of your bookkeeping."
					/>

					<Button
						asChild
						className="sm:self-start">
						<Link href={AccountController.create.url()}>
							<Plus />
							Create account
						</Link>
					</Button>
				</div>
				{/* Page Header Section End */}

				{/* Accounts Content Section Start */}
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{accounts.data.length > 0 ? (
						/* Account Cards Section Start */
						accounts.data.map((account) => (
							<Link
								key={account.id}
								href={AccountController.edit.url(account.id)}
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
