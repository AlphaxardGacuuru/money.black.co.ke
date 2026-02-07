/** @type {import('next').NextConfig} */
const nextConfig = {
	// Optimize production builds
	reactStrictMode: true,

	// Enable SWC minification for faster builds
	swcMinify: true,

	// Optimize images
	images: {
		formats: ["image/avif", "image/webp"],
		minimumCacheTTL: 60,
	},

	// Compiler optimizations
	compiler: {
		// Remove console.log in production
		removeConsole:
			process.env.NODE_ENV === "production"
				? {
						exclude: ["error", "warn"],
					}
				: false,
	},

	// Experimental features for better performance
	experimental: {
		// Optimize package imports
		optimizePackageImports: [
			"lucide-react",
			"@radix-ui/react-popover",
			"@radix-ui/react-slot",
		],
	},

	// Disable powered by header
	poweredByHeader: false,

	// Development optimizations
	...(process.env.NODE_ENV === "development" && {
		// Reduce memory usage in development
		onDemandEntries: {
			// Period (in ms) where the server will keep pages in the buffer
			maxInactiveAge: 25 * 1000,
			// Number of pages that should be kept simultaneously
			pagesBufferLength: 2,
		},
	}),
}

module.exports = nextConfig
