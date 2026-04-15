import { Form, Head } from "@inertiajs/react"
import InputError from "@/components/input-error"
import PasswordInput from "@/components/password-input"
import TextLink from "@/components/text-link"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { register } from "@/routes"
import { store } from "@/routes/login"
import { request } from "@/routes/password"

type Props = {
	status?: string
	canResetPassword: boolean
	canRegister: boolean
	canGoogleLogin: boolean
	googleLoginUrl: string
}

export default function Login({
	status,
	canResetPassword,
	canRegister,
	canGoogleLogin,
	googleLoginUrl,
}: Props) {
	return (
		<>
			<Head title="Log in" />

			<Form
				{...store.form()}
				resetOnSuccess={["password"]}
				className="flex flex-col gap-6">
				{({ processing, errors }) => (
					<>
						<div className="grid gap-6">
							{canGoogleLogin && (
								<div className="grid gap-3">
									<Button
										type="button"
										variant="outline"
										className="w-full"
										asChild>
										<a href={googleLoginUrl}>
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
								<Label htmlFor="email">Email address</Label>
								<Input
									id="email"
									type="email"
									name="email"
									required
									autoFocus
									tabIndex={1}
									autoComplete="email"
									placeholder="email@example.com"
								/>
								<InputError message={errors.email} />
							</div>

							<div className="grid gap-2">
								<div className="flex items-center">
									<Label htmlFor="password">Password</Label>
									{canResetPassword && (
										<TextLink
											href={request()}
											className="ml-auto text-sm"
											tabIndex={5}>
											Forgot password?
										</TextLink>
									)}
								</div>
								<PasswordInput
									id="password"
									name="password"
									required
									tabIndex={2}
									autoComplete="current-password"
									placeholder="Password"
								/>
								<InputError message={errors.password} />
							</div>

							<div className="flex items-center space-x-3">
								<Checkbox
									id="remember"
									name="remember"
									tabIndex={3}
								/>
								<Label htmlFor="remember">Remember me</Label>
							</div>

							<Button
								type="submit"
								className="mt-4 w-full"
								tabIndex={4}
								disabled={processing}
								data-test="login-button">
								{processing && <Spinner />}
								Log in
							</Button>
						</div>

						{canRegister && (
							<div className="text-center text-sm text-muted-foreground">
								Don't have an account?{" "}
								<TextLink
									href={register()}
									tabIndex={5}>
									Sign up
								</TextLink>
							</div>
						)}
					</>
				)}
			</Form>

			{status && (
				<div className="mb-4 text-center text-sm font-medium text-green-600">
					{status}
				</div>
			)}
		</>
	)
}

Login.layout = {
	title: "Log in to your account",
	description: "Enter your email and password below to log in",
}
