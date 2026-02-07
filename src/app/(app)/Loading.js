import ApplicationLogo from "@/components/ApplicationLogo"

const Loading = () => {
	return (
		<div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-[#232323] to-[#1a1a1a]">
			<div className="text-center flex flex-col items-center">
				{/* Logo */}
				<div className="mb-3 pt-20 text-white">
					<ApplicationLogo />
				</div>

				{/* Spacer to push loader to bottom */}
				<div className="flex-grow"></div>

				{/* Spinner at bottom - smaller */}
				<div className="pb-20">
					<div className="relative w-5 h-5 mx-auto mb-3">
						<div className="absolute inset-0 border-2 border-white/20 rounded-full"></div>
						<div className="absolute inset-0 border-2 border-transparent border-t-white rounded-full animate-spin"></div>
					</div>

					{/* Loading Text */}
					<p className="text-white text-sm font-light font-nunito animate-pulse">
						Loading...
					</p>
				</div>
			</div>
		</div>
	)
}

export default Loading
