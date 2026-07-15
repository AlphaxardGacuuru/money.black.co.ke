import { redirect } from "@tanstack/react-router"
import { queryClient } from "@/lib/query-client"
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
        throw redirect({ to: "/accounts" })
    }
}

/** Clear the auth cache — call this after logout. */
export function clearAuth() {
	localStorage.removeItem("sanctumToken")
	localStorage.removeItem("auth") 
	queryClient.cancelQueries({ queryKey: AUTH_QUERY.queryKey })
	queryClient.removeQueries({ queryKey: AUTH_QUERY.queryKey, exact: true })
    
    invalidateAuth()
}

/** Bust the auth cache — call this after storing a new token so the next render fetches fresh user data. */
export function invalidateAuth() {
    queryClient.setQueryData(AUTH_QUERY.queryKey, undefined)
    queryClient.invalidateQueries({ queryKey: AUTH_QUERY.queryKey })
}
