"use client"

import { createContext, useContext, useState, useEffect, useMemo } from "react"
import {
	getLocalStorage,
	getNormalLocalStorage,
	getLocalStorageAuth,
	setLocalStorage,
} from "@/lib/localStorage"

import Axios from "@/lib/axios"

const AppContext = createContext()

export const useApp = () => {
	const context = useContext(AppContext)
	if (!context) {
		throw new Error("useApp must be used within AppProvider")
	}
	return context
}

export const AppProvider = ({ children }) => {
	// Declare states
	const [messages, setMessages] = useState([])
	const [errors, setErrors] = useState([])
	const [formErrors, setFormErrors] = useState([])
	const [login, setLogin] = useState()
	const [auth, setAuth] = useState({
		id: 0,
		name: "Guest",
		username: "@guest",
		avatar: "/storage/avatars/male-avatar.png",
		accountType: "normal",
		propertyIds: [],
		assignedPropertyIds: [],
		subscriptionByPropertyIds: [],
		permissions: [],
	})
	const [headerMenu, setHeaderMenu] = useState()
	const [adminMenu, setAdminMenu] = useState("left-open")
	const [properties, setProperties] = useState([])
	const [selectedPropertyId, setSelectedPropertyId] = useState([])
	const [page, setPage] = useState({ name: "/", path: [] })
	const [loadingItems, setLoadingItems] = useState(0)
	const [showPayMenu, setShowPayMenu] = useState("")
	const [paymentTitle, setPaymentTitle] = useState()
	const [paymentDescription, setPaymentDescription] = useState()
	const [paymentAmount, setPaymentAmount] = useState()
	const [downloadLink, setDownloadLink] = useState()
	const [downloadLinkText, setDownloadLinkText] = useState("")

	// Initialize client-side only state after mount
	useEffect(() => {
		// Load auth from localStorage
		setAuth(getLocalStorageAuth("auth"))
		
		// Load properties from localStorage
		setProperties(getLocalStorage("properties"))
		
		// Set admin menu based on screen size
		if (typeof window !== "undefined" && window.innerWidth <= 768) {
			setAdminMenu("")
		}
		
		// Load selected property ID
		const storedId = getNormalLocalStorage("selectedPropertyId")
		const authData = getLocalStorageAuth("auth")
		setSelectedPropertyId(
			storedId || [...(authData.propertyIds ?? []), ...(authData.subscriptionByPropertyIds ?? [])]
		)
	}, [])

	// Function for fetching data from API
	const get = (
		endpoint,
		setState,
		storage = null,
		errors = true,
		controller = {}
	) => {
		// Increment loading items for select endpoints
		if (!["notifications"].includes(endpoint)) {
			setLoadingItems((prev) => prev + 1)
		}

		Axios.get(`/api/${endpoint}`, { signal: controller.signal }) // Pass the controller signal)
			.then((res) => {
				// Decrement loading items
				if (!["notifications"].includes(endpoint)) {
					setLoadingItems((prev) => prev - 1)
				}

				// Set State
				var data = res.data ? res.data.data : []
				setState(data)
				// Set Local Storage
				if (storage) {
					setLocalStorage(storage, data)
				}
			})
			.catch((error) => {
				// Decrement loading items
				if (!["notifications"].includes(endpoint)) {
					setLoadingItems((prev) => prev - 1)
				}

				if (Axios.isCancel(error)) {
					console.log(`Request for ${endpoint} canceled`)
				} else {
					// Show Errors
					errors && setErrors([`Failed to fetch ${endpoint.split("?")[0]}`])
				}
			})
	}

	// Function for fetching data from API
	const getPaginated = (
		endpoint,
		setState,
		storage = null,
		errors = true,
		controller = {}
	) => {
		// Increment loading items for select endpoints
		if (!["notifications"].includes(endpoint)) {
			setLoadingItems((prev) => prev + 1)
		}

		Axios.get(`/api/${endpoint}`)
			.then((res) => {
				// Decrement loading items
				if (!["notifications"].includes(endpoint)) {
					setLoadingItems((prev) => prev - 1)
				}

				// Set State
				var data = res.data ? res.data : []
				setState(data)
				// Set Local Storage
				storage && setLocalStorage(storage, data)
			})
			.catch(() => {
				// Decrement loading items
				if (!["notifications"].includes(endpoint)) {
					setLoadingItems((prev) => prev - 1)
				}

				// Set Errors
				errors && setErrors([`Failed to fetch ${endpoint.split("?")[0]}`])
			})
	}

	// Function for showing iteration
	const iterator = (key, list) => {
		return key + 1 + list.meta.per_page * (list.meta.current_page - 1)
	}

	// Function for getting errors from responses
	const getErrors = (err, message = false) => {
		const validationErrors = err.response.data.errors
		var errorsAsArray = []

		for (var field in validationErrors) {
			errorsAsArray.push(validationErrors[field])
		}

		// Get Errors with keys as the field names
		var arraysWithFieldNames = []
		for (var field in validationErrors) {
			arraysWithFieldNames.push({
				field: field,
				message: validationErrors[field],
			})
		}

		// Get other errors
		message && errorsAsArray.push(err.response.data.message)
		errors && setErrors(errorsAsArray)
		formErrors && setFormErrors(arraysWithFieldNames)
	}

	const formatToCommas = (e) => {
		let value = e.target.value.toString().replace(/[^0-9.]/g, "")
		value = Number(value)
		e.target.value = value.toLocaleString("en-US")

		return e.target.value.replace(/,/g, "")
	}
	/*
	 * Genereate Month and Year Arrays
	 */
	const { currentDate, currentYear, currentMonth, months, years } = useMemo(() => {
		const date = new Date()
		const year = date.getFullYear()
		const month = date.getMonth() + 1

		const monthsList = [
			"Select Month",
			"January",
			"February",
			"March",
			"April",
			"May",
			"June",
			"July",
			"August",
			"September",
			"October",
			"November",
			"December",
		]

		const yearsList = []
		for (let i = year; i > 2009; i--) {
			yearsList.push(i)
		}

		return {
			currentDate: date,
			currentYear: year,
			currentMonth: month,
			months: monthsList,
			years: yearsList,
		}
	}, [])

	const value = {
		messages,
		setMessages,
		errors,
		setErrors,
		formErrors,
		setFormErrors,
		login,
		setLogin,
		auth,
		setAuth,
		headerMenu,
		setHeaderMenu,
		adminMenu,
		setAdminMenu,
		properties,
		setProperties,
		selectedPropertyId,
		setSelectedPropertyId,
		page,
		setPage,
		loadingItems,
		setLoadingItems,
		showPayMenu,
		setShowPayMenu,
		paymentTitle,
		setPaymentTitle,
		paymentDescription,
		setPaymentDescription,
		paymentAmount,
		setPaymentAmount,
		downloadLink,
		setDownloadLink,
		downloadLinkText,
		setDownloadLinkText,

		// Functions
		get,
		getPaginated,
		iterator,
		getErrors,
		formatToCommas,

		// Date
		currentDate,
		currentYear,
		currentMonth,
		months,
		years,
	}

	return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
