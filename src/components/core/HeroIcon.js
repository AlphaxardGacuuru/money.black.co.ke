import React from "react"

const HeroIcon = ({ children, color = "white" }) => {
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

	return (
		<div
			className={`backdrop-blur-xl border text-4xl py-6 px-6 rounded-full shadow-lg transition-all duration-500 ${colorClasses[color]}`}>
			{children}
		</div>
	)
}

export default HeroIcon
