import Axios from "axios"

const AxiosClient = Axios.create({
	baseURL: "/",
	headers: {
		"X-Requested-With": "XMLHttpRequest",
	},
	withCredentials: true,
	withXSRFToken: true,
})

export default AxiosClient
