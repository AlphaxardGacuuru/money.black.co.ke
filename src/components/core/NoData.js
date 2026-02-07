import React from "react"
import Image from "next/image"

const NoData = () => {
	return (
		<div className="bg-white/5 border border-white/10 text-center w-full py-8">
			<div className="flex justify-center">
				<Image
					src="/img/no-data-found.jpg"
					alt="No entries found"
					width={400}
					height={300}
					className="w-[30%] h-auto opacity-50"
				/>
			</div>
			<h5 className="text-white/50 text-lg font-medium mt-4">
				We didn't find anything
			</h5>
		</div>
	)
}

export default NoData
