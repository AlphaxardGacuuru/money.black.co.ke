export const HOME_PAGE_OPTIONS = [
	{ value: "accounts", label: "Accounts", href: "/accounts" },
	{ value: "categories", label: "Categories", href: "/categories" },
	{ value: "transactions", label: "Transactions", href: "/transactions" },
	{ value: "overview", label: "Overview", href: "/overview" },
] as const

export type HomePageValue = (typeof HOME_PAGE_OPTIONS)[number]["value"]

export const DEFAULT_HOME_PAGE: HomePageValue = "categories"

/** Resolve the route a user should land on, falling back to the default home page. */
export function getHomePageHref(value?: string | null): string {
	return (
		HOME_PAGE_OPTIONS.find((option) => option.value === value)?.href ??
		HOME_PAGE_OPTIONS.find((option) => option.value === DEFAULT_HOME_PAGE)!.href
	)
}
