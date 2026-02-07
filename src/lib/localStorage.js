// Function for checking local storage
export const getLocalStorage = (state, string = "array") => {
	if (typeof window !== "undefined" && localStorage.getItem(state)) {
		return JSON.parse(localStorage.getItem(state))
	} else if (string == "string") {
		return ""
	} else {
		return []
	}
}

// Function for checking non array local storage
export const getNormalLocalStorage = (state) => {
	if (typeof window !== "undefined" && localStorage.getItem(state)) {
		return localStorage.getItem(state)
	} else {
		return ""
	}
}

// Function for checking local storage auth
export const getLocalStorageAuth = (state) => {
	if (typeof window !== "undefined" && localStorage.getItem(state)) {
		return JSON.parse(localStorage.getItem(state))
	} else {
		return {
			id: 0,
			name: "Guest",
			username: "@guest",
			avatar: "/storage/avatars/male-avatar.png",
			accountType: "normal",
			propertyIds: [],
			assignedPropertyIds: [],
			subscriptionByPropertyIds: [],
			permissions: [],
		}
	}
}

// Function to set local storage
export const setLocalStorage = (state, data) => {
	localStorage.setItem(state, JSON.stringify(data))
}
