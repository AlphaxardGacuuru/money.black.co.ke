import { Form, Head } from "@inertiajs/react"
import { useState } from "react"
import InputError from "@/components/input-error"
import PasswordInput from "@/components/password-input"
import TextLink from "@/components/text-link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { login } from "@/routes"
import { store } from "@/routes/register"

type Props = {
	canGoogleLogin: boolean
	googleLoginUrl: string
	familyJoin?: {
		relationship_type?: string
		tree_name?: string
		inviter_name?: string
	} | null
}

export default function Register({
	canGoogleLogin,
	googleLoginUrl,
	familyJoin,
}: Props) {
	const [googleLoading, setGoogleLoading] = useState(false)

	return (
		<>
			<Head title="Register" />
			<Form
				{...store.form()}
				resetOnSuccess={["password", "password_confirmation"]}
				disableWhileProcessing
				className="flex flex-col gap-6">
				{({ processing, errors }) => (
					<>
						<div className="grid gap-6">
							{familyJoin && (
								<div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-950">
									<p className="font-semibold">
										Join {familyJoin.tree_name ?? "a family tree"} as{" "}
										{familyJoin.relationship_type ?? "a family member"}
									</p>
									<p className="mt-1 text-amber-800">
										{familyJoin.inviter_name
											? `${familyJoin.inviter_name} shared this invite link with you.`
											: "This link will connect your account to an existing family tree."}
									</p>
								</div>
							)}

							{canGoogleLogin && (
								<div className="grid gap-3">
									<Button
										type="button"
										variant="outline"
										className="w-full"
										disabled={googleLoading || processing}
										asChild>
										<a
											href={googleLoginUrl}
											onClick={(event) => {
												if (googleLoading || processing) {
													event.preventDefault()

													return
												}

												setGoogleLoading(true)
											}}
											className={googleLoading ? "pointer-events-none" : undefined}
											aria-disabled={googleLoading || processing}>
											{googleLoading ? (
												<>
													<Spinner />
													Redirecting to Google...
												</>
											) : (
												<>
													<svg
														aria-hidden="true"
														className="size-4"
														viewBox="0 0 24 24">
														<path
															fill="#4285F4"
															d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.39 3.61v3h3.86c2.25-2.07 3.58-5.12 3.58-8.64Z"
														/>
														<path
															fill="#34A853"
															d="M12 24c3.24 0 5.96-1.08 7.95-2.92l-3.86-3c-1.08.72-2.46 1.14-4.09 1.14-3.14 0-5.8-2.12-6.75-4.97H1.26v3.1A12 12 0 0 0 12 24Z"
														/>
														<path
															fill="#FBBC05"
															d="M5.25 14.25A7.2 7.2 0 0 1 4.87 12c0-.78.14-1.53.38-2.25v-3.1H1.26A12 12 0 0 0 0 12c0 1.93.46 3.76 1.26 5.35l3.99-3.1Z"
														/>
														<path
															fill="#EA4335"
															d="M12 4.78c1.76 0 3.34.61 4.58 1.82l3.43-3.43C17.95 1.25 15.23 0 12 0A12 12 0 0 0 1.26 6.65l3.99 3.1c.94-2.85 3.61-4.97 6.75-4.97Z"
														/>
													</svg>
													Continue with Google
												</>
											)}
										</a>
									</Button>
									<InputError message={errors.socialite} />
									<div className="relative">
										<div className="absolute inset-0 flex items-center">
											<span className="w-full border-t" />
										</div>
										<div className="relative flex justify-center text-xs uppercase">
											<span className="bg-background px-2 text-muted-foreground">
												Or continue with email
											</span>
										</div>
									</div>
								</div>
							)}

							<div className="grid gap-2">
								<Input
									id="name"
									label="Name"
									type="text"
									required
									autoFocus
									tabIndex={1}
									autoComplete="name"
									name="name"
									placeholder="Full name"
								/>
								<InputError
									message={errors.name}
									className="mt-2"
								/>
							</div>

							<div className="grid gap-2">
								<Input
									id="email"
									label="Email address"
									type="email"
									required
									tabIndex={2}
									autoComplete="email"
									name="email"
									placeholder="email@example.com"
								/>
								<InputError message={errors.email} />
							</div>

							<div className="grid gap-2">
								<PasswordInput
									id="password"
									required
									tabIndex={3}
									autoComplete="new-password"
									name="password"
									placeholder="Password"
								/>
								<InputError message={errors.password} />
							</div>

							<div className="grid gap-2">
								<PasswordInput
									id="password_confirmation"
									label="Confirm Password"
									required
									tabIndex={4}
									autoComplete="new-password"
									name="password_confirmation"
									placeholder="Confirm password"
								/>
								<InputError message={errors.password_confirmation} />
							</div>

							<Button
								type="submit"
								className="mt-2 w-full"
								tabIndex={5}
								data-test="register-user-button">
								{processing && <Spinner />}
								Create account
							</Button>
						</div>

						<div className="text-center text-sm text-muted-foreground">
							Already have an account?{" "}
							<TextLink
								href={login()}
								tabIndex={6}>
								Log in
							</TextLink>
						</div>
					</>
				)}
			</Form>
		</>
	)
}

Register.layout = {
	title: "Create an account",
	description: "Enter your details below to create your account",
}
