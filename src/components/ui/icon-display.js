"use client"

import React from "react"
import * as AllIcons from "@/svgs"

const IconDisplay = ({ icon, className, defaultIcon: DefaultIcon }) => {
	const IconComponent = AllIcons[icon] || DefaultIcon

	if (!IconComponent) return null

	return <IconComponent className={className} />
}

export default IconDisplay
