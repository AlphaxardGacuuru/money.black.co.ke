import Axios from "axios"

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
	if (config.method?.toLowerCase() === "get") {
		config.params = {
			...(config.params ?? {}),
			_t: Date.now(),
		}
	}

	return config
})

export default AxiosClient
