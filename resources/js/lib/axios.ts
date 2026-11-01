import Axios, { isAxiosError } from "axios"
import { queryClient } from "@/lib/query-client"

const AxiosClient = Axios.create({
	baseURL: "/",
	headers: {
		"X-Requested-With": "XMLHttpRequest",
		"Cache-Control": "no-cache, no-store, must-revalidate",
		Pragma: "no-cache",
		Expires: "0",
	},
	withCredentials: true,
	withXSRFToken: true,
})

AxiosClient.interceptors.request.use((config) => {
	const raw = localStorage.getItem("sanctumToken")

	if (raw) {
		try {
			const token = JSON.parse(raw) as string
			if (token) {
				config.headers.Authorization = `Bearer ${token}`
			}
		} catch {
			// malformed storage value — skip
		}
	}

	return config
})

// The device locked while idle: refetch auth so the lock screen shows.
AxiosClient.interceptors.response.use(undefined, (error) => {
	if (
		isAxiosError(error) &&
		error.response?.status === 423 &&
		error.response.data?.app_locked
	) {
		queryClient.invalidateQueries({ queryKey: ["auth"] })
	}

	return Promise.reject(error)
})

export default AxiosClient
