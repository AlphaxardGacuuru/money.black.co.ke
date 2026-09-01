import { redirect } from "@tanstack/react-router"
import { queryClient } from "@/lib/query-client"
import { getHomePageHref } from "@/lib/home-page"
import Axios from "@/lib/axios"
import type { User } from "@/types"

const AUTH_QUERY = {
    queryKey: ["auth"] as const,
    queryFn: (): Promise<User> =>
    Axios.get("/api/auth").then((res) => res.data.data),
}

async function getAuth(): Promise<User | null> {
    const cached = queryClient.getQueryData<User>(AUTH_QUERY.queryKey)

    if (cached !== undefined) {
        return cached
    }

    try {
        return await queryClient.fetchQuery(AUTH_QUERY)
    } catch {
        return null
    }
}

/** Redirect unauthenticated users to /login. Use on protected routes. */
export async function requireAuth() {
    const auth = await getAuth()
    if (!auth) {
        throw redirect({ to: "/login" })
    }
}

/** Redirect authenticated users away from guest-only routes (e.g. login, register). */
export async function requireGuest() {
    const auth = await getAuth()
    if (auth) {
        throw redirect({ to: getHomePageHref(auth.home_page) })
    }
}

/** Fetch the freshest auth data and resolve the user's preferred home route. Call after login. */
export async function resolveHomeHref(): Promise<string> {
    try {
        const auth = await queryClient.fetchQuery({ ...AUTH_QUERY, staleTime: 0 })
        return getHomePageHref(auth?.home_page)
    } catch {
        return getHomePageHref()
    }
}

/** Clear the auth cache — call this after logout. */
export function clearAuth() {
	localStorage.removeItem("sanctumToken")
	localStorage.removeItem("auth")

	// `resetQueries` (unlike `removeQueries`) resets the query that any already-mounted
	// `useQuery(["auth"])` observer is still holding onto, so components relying on the
	// old (authenticated) result actually re-render instead of showing stale data.
	queryClient.resetQueries({ queryKey: AUTH_QUERY.queryKey, exact: true })
}

/** Bust the auth cache — call this after storing a new token so the next render fetches fresh user data. */
export function invalidateAuth() {
    queryClient.invalidateQueries({ queryKey: AUTH_QUERY.queryKey })
}
