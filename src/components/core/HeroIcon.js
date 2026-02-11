"use client"

import React, { useState } from "react"

const hexToRgba = (hex, alpha) => {
	if (!hex) return ""
	let r = 0,
		g = 0,
		b = 0
	// Handle 3-char hex
	if (hex.length === 4) {
		r = parseInt(hex[1] + hex[1], 16)
		g = parseInt(hex[2] + hex[2], 16)
		b = parseInt(hex[3] + hex[3], 16)
	} else if (hex.length === 7) {
		r = parseInt(hex[1] + hex[2], 16)
		g = parseInt(hex[3] + hex[4], 16)
		b = parseInt(hex[5] + hex[6], 16)
	}
	return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const HeroIcon = ({ children, color = "white" }) => {
	const [isHovered, setIsHovered] = useState(false)

	const colorClasses = {
		white: "bg-white/10 border-white/20 text-white hover:bg-white/20",
		purple:
			"bg-purple-400/10 border-purple-400/30 text-purple-400 hover:bg-purple-400/20",
		blue: "bg-blue-400/10 border-blue-400/30 text-blue-400 hover:bg-blue-400/20",
		green:
			"bg-green-400/10 border-green-400/30 text-green-400 hover:bg-green-400/20",
		yellow:
			"bg-yellow-400/10 border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/20",
		red: "bg-red-400/10 border-red-400/30 text-red-400 hover:bg-red-400/20",
	}

	const isHex = color?.startsWith("#")
	const customStyle = isHex
		? {
				color: color,
				backgroundColor: hexToRgba(color, isHovered ? 0.2 : 0.1),
				borderColor: hexToRgba(color, 0.3),
			}
		: {}

	return (
		<div
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			className={`backdrop-blur-xl border text-4xl py-6 px-6 rounded-full shadow-lg transition-all duration-500 ${
				!isHex ? colorClasses[color] || colorClasses.white : ""
			}`}
			style={customStyle}>
			{children}
		</div>
	)
}

export default HeroIcon
