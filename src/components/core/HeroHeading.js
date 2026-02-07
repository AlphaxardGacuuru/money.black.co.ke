import React from "react"

const HeroHeading = ({ heading, data }) => {
	return (
		<div className="my-auto">
			<h4 className="text-white/70 font-normal text-sm uppercase tracking-wider">
				{heading}
			</h4>
			<span className="text-2xl font-semibold text-white">{data}</span>
		</div>
	)
}

export default HeroHeading
