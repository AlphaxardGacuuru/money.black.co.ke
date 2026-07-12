import type { ImgHTMLAttributes } from "react"

export default function AppLogoIcon(
	props: ImgHTMLAttributes<HTMLImageElement>
) {
	return (
		<img
			src="/default-monochrome-black.svg"
			alt="Black Money logo icon"
			aria-hidden="true"
			{...props}
		/>
	)
}
