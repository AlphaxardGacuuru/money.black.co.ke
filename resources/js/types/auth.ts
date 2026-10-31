export type UserSettings = {
	permissionsOnboardedAt?: string
	[key: string]: unknown
}

export type User = {
	id: number
	name: string
	email: string
	avatar?: string
	email_verified_at: string | null
	twoFactorEnabled?: boolean
	home_page?: string
	can_view_telescope?: boolean
	can_view_horizon?: boolean
	can_view_pulse?: boolean
	can_view_ai_usage?: boolean
	settings?: UserSettings | null
	created_at: string
	updated_at: string
	[key: string]: unknown
}

export type TwoFactorSetupData = {
	svg: string
	url: string
}

export type TwoFactorSecretKey = {
	secretKey: string
}
