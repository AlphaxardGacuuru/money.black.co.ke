const Header = ({ title }) => {
	return (
		<header className="bg-white/5 backdrop-blur-xl border-b border-white/10 relative z-10">
			<div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
				<h2 className="font-semibold text-xl text-white leading-tight">
					{title}
				</h2>
			</div>
		</header>
	)
}

export default Header
