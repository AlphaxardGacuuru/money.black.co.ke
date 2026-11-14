import { existsSync } from "node:fs"
import { expect, test } from "@playwright/test"
import type { Page } from "@playwright/test"

const PAGES = [
	"/accounts",
	"/categories",
	"/receipts",
	"/transactions",
	"/overview",
	"/tools",
	"/settings/profile",
	"/settings/security",
	"/settings/appearance",
]

/** Collects uncaught errors and console errors while a page is open. */
function watchErrors(page: Page): string[] {
	const errors: string[] = []

	page.on("pageerror", (error) => errors.push(error.message))
	page.on("console", (message) => {
		if (message.type() === "error") {
			errors.push(message.text())
		}
	})

	return errors
}

/** The app mounted something, so the screen isn't blank. */
async function expectAppRendered(page: Page) {
	await expect(page.locator("#app > *").first()).toBeVisible({ timeout: 15_000 })
}

for (const path of PAGES) {
	test(`${path} opens without errors and fits the phone screen`, async ({ page }) => {
		const errors = watchErrors(page)

		await page.goto(path)
		await expectAppRendered(page)
		await expect(page).toHaveURL(new RegExp(`${path}$`))
		await expect(page.getByRole("navigation").last()).toBeVisible()
		await page.waitForLoadState("networkidle")

		const overflow = await page.evaluate(
			() => document.documentElement.scrollWidth - window.innerWidth
		)

		expect(overflow, "page is wider than the screen").toBeLessThanOrEqual(0)
		expect(errors).toEqual([])
	})
}

test("the bottom nav moves between pages", async ({ page }) => {
	await page.goto("/accounts")
	await expectAppRendered(page)

	const bottomNav = page.locator("nav.max-w-md")

	await bottomNav
		.getByRole("link", { name: "Transactions" })
		.click()
	await expect(page).toHaveURL(/\/transactions$/)

	await bottomNav
		.getByRole("link", { name: "Overview" })
		.click()
	await expect(page).toHaveURL(/\/overview$/)
})

test("signed out visitors are sent to the login page", async ({ browser }) => {
	const context = await browser.newContext({ storageState: { cookies: [], origins: [] } })
	const page = await context.newPage()

	await page.goto("/accounts")
	await expect(page).toHaveURL(/\/login/)

	await context.close()
})

test("the app still opens offline once the service worker has it", async ({ page, context }) => {
	// The Vite dev server serves unbundled modules the service worker never
	// precaches, so this only means something against built assets.
	test.skip(existsSync("public/hot"), "needs built assets, not `npm run dev`")

	await page.goto("/accounts")
	await expectAppRendered(page)
	await page.evaluate(() => navigator.serviceWorker.ready)
	// Load once under the service worker's control so it caches the page.
	await page.reload()
	await expectAppRendered(page)

	await context.setOffline(true)
	await page.reload()
	await expectAppRendered(page)
	await context.setOffline(false)
})
