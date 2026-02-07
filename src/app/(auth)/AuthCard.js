const AuthCard = ({ logo, children }) => (
	<div className="min-h-screen flex flex-col justify-center items-center px-6 bg-gradient-to-br from-[#232323] to-[#1a1a1a] relative overflow-hidden">
		{/* Animated Background Elements */}
		<div className="absolute inset-0 overflow-hidden pointer-events-none">
			<div className="absolute top-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
			<div className="absolute bottom-20 left-20 w-80 h-80 bg-blue-400/5 rounded-full blur-3xl animate-pulse animation-delay-1000" />
			<div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-400/5 rounded-full blur-3xl animate-pulse animation-delay-2000" />
		</div>

		<div className="relative z-10 mb-8">{logo}</div>

		<div className="w-full sm:max-w-md relative z-10">
			<div className="bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden rounded-3xl p-8 shadow-2xl">
				{children}
			</div>
		</div>
	</div>
)

export default AuthCard
