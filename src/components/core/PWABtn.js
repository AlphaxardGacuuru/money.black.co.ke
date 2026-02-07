import React, { useRef, useState } from 'react'

const PWABtn = (props) => {
	/*
	 *
	 * Register service worker */
	if (window.location.href.match(/https/)) {
		if ("serviceWorker" in navigator) {
			window.addEventListener("load", () => {
				navigator.serviceWorker.register("/sw.js")
				// .then((reg) => console.log('Service worker registered', reg))
				// .catch((err) => console.log('Service worker not registered', err));
			})
		}
	}

	let deferredPrompt
	
	// Listen to the install prompt
	window.addEventListener("beforeinstallprompt", (e) => {
		deferredPrompt = e

		// Show the button
		props.setDownloadLink(true)

		// Action when button is clicked
		props.btnAdd.current.addEventListener("click", (e) => {
			// Show install banner
			deferredPrompt.prompt()
			// Check if the user accepted
			deferredPrompt.userChoice.then((choiceResult) => {
				if (choiceResult.outcome === "accepted") {
					props.setDownloadLinkText("User accepted")
				}
				deferredPrompt = null
			})

			window.addEventListener("appinstalled", (evt) => {
				props.setDownloadLinkText("Installed")
			})
		})
	})

	return (
		<button
			ref={props.btnAdd}
			style={{ display: "none" }}>
			test
		</button>
	)
}

export default PWABtn