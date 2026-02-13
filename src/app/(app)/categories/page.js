"use client"

import { useApp } from "@/contexts/AppContext"
import { useState, useEffect } from "react"
import Header from "@/app/(app)/Header"
// import CategoryList from "@/components/categories/CategoryList"

const Categories = (props) => {
	const appProps = useApp()

	// Add appProps to props
	props = { ...props, ...appProps }

	const [categories, setCategories] = useState([])

	useEffect(() => {
		// Fetch Categories
		props.getPaginated(`categories?userId=${props.userId}`, setCategories)
	}, [])

	return (
		<>
			<Header title="Categories" />

			<div className="py-12 px-6">
				{/* <CategoryList
					{...props}
					categories={categories}
					setCategories={setCategories}
					name={name}
					setName={setName}
					email={email}
					setEmail={setEmail}
					phone={phone}
					setPhone={setPhone}
				/> */}
			</div>
		</>
	)
}

export default Categories
