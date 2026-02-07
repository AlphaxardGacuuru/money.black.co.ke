import { Nunito, Roboto } from "next/font/google"
import "@/app/global.css"
import { AppProvider } from "@/contexts/AppContext"
import AppContextInjector from "@/components/AppContextInjector"
import CsrfInitializer from "@/components/CsrfInitializer"

const nunitoFont = Nunito({
	subsets: ["latin"],
	display: "swap",
	weight: ["200", "300", "400", "500", "600", "700"],
	variable: "--font-nunito",
	preload: true, // Preload for faster initial load
	adjustFontFallback: true, // Reduce layout shift
})

const robotoFont = Roboto({
	subsets: ["latin"],
	display: "swap",
	weight: ["100", "300", "400", "500", "700"],
	variable: "--font-roboto",
	preload: true, // Preload for faster initial load
	adjustFontFallback: true, // Reduce layout shift
})

const RootLayout = ({ children }) => {
	return (
		<html
			lang="en"
			className={`${nunitoFont.className} ${robotoFont.variable}`}
			suppressHydrationWarning>
			<body
				className="antialiased font-light bg-gradient-to-br from-[#000000] via-[#1a1a1a] to-[#232323] min-h-screen"
				suppressHydrationWarning>
				<AppProvider>
					<CsrfInitializer />
					<AppContextInjector>{children}</AppContextInjector>
				</AppProvider>
			</body>
		</html>
	)
}

export const metadata = {
	title: "Laravel",
}

export default RootLayout
