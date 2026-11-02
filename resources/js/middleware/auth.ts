import { redirect } from "@tanstack/react-router"
import { queryOptions } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { queryClient } from "@/lib/query-client"
import { getHomePageHref } from "@/lib/home-page"
import Axios from "@/lib/axios"
import type { User } from "@/types"

export const AUTH_QUERY = queryOptions({
    queryKey: ["auth"] as const,
    queryFn: (): Promise<User> =>
    Axios.get("/api/auth").then((res) => res.data.data),
    // A 401 means the session is gone; retrying only delays sending the user to /login.
    retry: (failureCount, error) => !isUnauthenticated(error) && failureCount < 3,
})

export function isUnauthenticated(error: unknown): boolean {
    return isAxiosError(error) && error.response?.status === 401
}

/** The user saved on the last visit, if this browser still holds a token. */
function storedAuth(): User | null {
    try {
        const raw = localStorage.getItem("auth")

        return raw && localStorage.getItem("sanctumToken") ? (JSON.parse(raw) as User) : null
    } catch {
        return null
    }
}

/**
 * Resolve the user without waiting on the network when we already know who it is,
 * so routes render straight away instead of flashing a blank screen. The copy saved
 * in localStorage is marked stale, so the auth query refreshes it in the background.
 */
function getAuth(): User | null | Promise<User | null> {
    const cached = queryClient.getQueryData<User>(AUTH_QUERY.queryKey)

    if (cached !== undefined) {
        return cached
    }

    const stored = storedAuth()

    if (stored) {
        queryClient.setQueryData(AUTH_QUERY.queryKey, stored, { updatedAt: 0 })

        return stored
    }

    return queryClient.fetchQuery(AUTH_QUERY).catch(() => null)
}

/** Run `check` on the user, synchronously when it's already known (a promise would make the route pending). */
function withAuth(check: (auth: User | null) => void): void | Promise<void> {
    const auth = getAuth()

    return auth instanceof Promise ? auth.then(check) : check(auth)
}

/** Redirect unauthenticated users to /login. Use on protected routes. */
export function requireAuth() {
    return withAuth((auth) => {
        if (!auth) {
            throw redirect({ to: "/login" })
        }
    })
}

/** Redirect authenticated users away from guest-only routes (e.g. login, register). */
export function requireGuest() {
    return withAuth((auth) => {
        if (auth) {
            throw redirect({ to: getHomePageHref(auth.home_page) })
        }
    })
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
