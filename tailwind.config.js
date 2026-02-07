module.exports = {
	content: ["./src/**/*.{js,jsx,ts,tsx}"],
	theme: {
		extend: {
			fontFamily: {
				nunito: ["var(--font-nunito)", "Nunito", "sans-serif"],
				roboto: ["var(--font-roboto)", "Roboto", "sans-serif"],
			},
			fontWeight: {
				thin: "100",
				extralight: "200",
				light: "300",
			},
			keyframes: {
				"accordion-down": {
					from: { height: "0" },
					to: { height: "var(--radix-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--radix-accordion-content-height)" },
					to: { height: "0" },
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
			},
		},
	},
	plugins: [require("@tailwindcss/forms"), require("tailwindcss-animate")],
}
