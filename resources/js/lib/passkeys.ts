/**
 * Minimal WebAuthn helpers for biometric (passkey) login.
 *
 * The server sends ceremony options with binary fields encoded as base64url
 * strings; these helpers convert them for `navigator.credentials` and
 * serialize the resulting credential back into JSON for the API.
 */

type CredentialDescriptorJSON = {
	id: string
	type: "public-key"
	transports?: AuthenticatorTransport[]
}

export type CreationOptionsJSON = Omit<
	PublicKeyCredentialCreationOptions,
	"challenge" | "user" | "excludeCredentials"
> & {
	challenge: string
	user: { id: string; name: string; displayName: string }
	excludeCredentials?: CredentialDescriptorJSON[]
}

export type RequestOptionsJSON = Omit<
	PublicKeyCredentialRequestOptions,
	"challenge" | "allowCredentials"
> & {
	challenge: string
	allowCredentials?: CredentialDescriptorJSON[]
}

export type SerializedCredential = {
	id: string
	rawId: string
	type: string
	authenticatorAttachment?: string | null
	clientExtensionResults: AuthenticationExtensionsClientOutputs
	response: Record<string, string | string[] | null>
}

function base64UrlToBuffer(value: string): ArrayBuffer {
	const base64 = value.replace(/-/g, "+").replace(/_/g, "/")
	const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=")
	const binary = atob(padded)
	const bytes = new Uint8Array(binary.length)

	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i)
	}

	return bytes.buffer
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer)
	let binary = ""

	for (const byte of bytes) {
		binary += String.fromCharCode(byte)
	}

	return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function toDescriptor(descriptor: CredentialDescriptorJSON): PublicKeyCredentialDescriptor {
	return { ...descriptor, id: base64UrlToBuffer(descriptor.id) }
}

function serialize(credential: PublicKeyCredential): SerializedCredential {
	const response = credential.response
	const serializedResponse: SerializedCredential["response"] = {
		clientDataJSON: bufferToBase64Url(response.clientDataJSON),
	}

	if (response instanceof AuthenticatorAttestationResponse) {
		serializedResponse.attestationObject = bufferToBase64Url(response.attestationObject)
		serializedResponse.transports = response.getTransports?.() ?? []
	}

	if (response instanceof AuthenticatorAssertionResponse) {
		serializedResponse.authenticatorData = bufferToBase64Url(response.authenticatorData)
		serializedResponse.signature = bufferToBase64Url(response.signature)
		serializedResponse.userHandle = response.userHandle
			? bufferToBase64Url(response.userHandle)
			: null
	}

	return {
		id: credential.id,
		rawId: bufferToBase64Url(credential.rawId),
		type: credential.type,
		authenticatorAttachment: credential.authenticatorAttachment,
		clientExtensionResults: credential.getClientExtensionResults(),
		response: serializedResponse,
	}
}

/**
 * Whether the browser supports WebAuthn at all.
 */
export function passkeysSupported(): boolean {
	return typeof window !== "undefined" && "PublicKeyCredential" in window && !!navigator.credentials
}

/**
 * Whether this device has a built-in biometric authenticator (Face ID, Touch ID, Windows Hello, fingerprint).
 */
export async function platformAuthenticatorAvailable(): Promise<boolean> {
	if (!passkeysSupported()) {
		return false
	}

	try {
		return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
	} catch {
		return false
	}
}

/**
 * Prompt the user to create a passkey on this device.
 */
export async function createPasskey(options: CreationOptionsJSON): Promise<SerializedCredential> {
	const credential = (await navigator.credentials.create({
		publicKey: {
			...options,
			challenge: base64UrlToBuffer(options.challenge),
			user: { ...options.user, id: base64UrlToBuffer(options.user.id) },
			excludeCredentials: options.excludeCredentials?.map(toDescriptor),
		},
	})) as PublicKeyCredential | null

	if (!credential) {
		throw new Error("Passkey creation was cancelled.")
	}

	return serialize(credential)
}

/**
 * Prompt the user to sign in with an existing passkey.
 */
export async function getPasskey(options: RequestOptionsJSON): Promise<SerializedCredential> {
	const credential = (await navigator.credentials.get({
		publicKey: {
			...options,
			challenge: base64UrlToBuffer(options.challenge),
			allowCredentials: options.allowCredentials?.map(toDescriptor),
		},
	})) as PublicKeyCredential | null

	if (!credential) {
		throw new Error("Passkey sign-in was cancelled.")
	}

	return serialize(credential)
}

/**
 * True when the user dismissed or timed out the browser's biometric prompt.
 */
export function isPasskeyCancellation(error: unknown): boolean {
	return error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "AbortError")
}

/**
 * A friendly default name for a passkey registered on the current device.
 */
export function defaultPasskeyName(): string {
	const ua = navigator.userAgent

	if (/iPhone/.test(ua)) {
return "iPhone"
}
	if (/iPad/.test(ua)) {
return "iPad"
}
	if (/Android/.test(ua)) {
return "Android device"
}
	if (/Macintosh/.test(ua)) {
return "Mac"
}
	if (/Windows/.test(ua)) {
return "Windows PC"
}

	return "This device"
}
