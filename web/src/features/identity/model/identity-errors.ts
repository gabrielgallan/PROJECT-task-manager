import { HTTPError } from 'ky'

type IdentityOperation =
	| 'login'
	| 'register'
	| 'recovery'
	| 'reset'
	| 'password'
	| 'profile'
	| 'avatar'
	| 'sessions'
	| 'revoke'
	| 'logout'
	| 'delete'

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null
}

export function getHttpStatus(error: unknown) {
	return error instanceof HTTPError ? error.response.status : undefined
}

export function getValidationErrors(error: unknown): Record<string, string> {
	if (!(error instanceof HTTPError) || !isRecord(error.data)) return {}
	const details = error.data.errors
	if (!isRecord(details) || !isRecord(details.fieldErrors)) return {}
	return Object.fromEntries(
		Object.entries(details.fieldErrors)
			.filter(([, messages]) => Array.isArray(messages) && messages.length > 0)
			.map(([field]) => [field, 'Check this field and try again.']),
	)
}

export function getIdentityError(error: unknown, operation: IdentityOperation) {
	const status = getHttpStatus(error)
	if (!status) return 'Unable to connect. Check your connection and try again.'
	if (status >= 500) return 'The service is unavailable. Please try again.'
	if (status === 401) return 'This action is not allowed. Please try again.'
	if (status === 409 && operation === 'register') return 'An account already uses this email.'
	if (status === 400 && operation === 'login') return 'Invalid email or password.'
	if (status === 400 && operation === 'password') return 'Your current password is incorrect.'
	if (status === 404 && operation === 'recovery') return 'No account found with this email.'
	if ((status === 400 || status === 404) && operation === 'reset') {
		return 'This recovery link is invalid or no longer available. Request a new link.'
	}
	if (status === 400 && operation === 'avatar')
		return 'The image was not accepted. Check its type and size.'
	if (status === 404 && operation === 'revoke')
		return 'This session is no longer available. Refreshing the list.'
	if (status === 400) return 'Check your details and try again.'
	if (status === 404) return 'The requested information is no longer available. Please try again.'
	return 'Unable to complete this action. Please try again.'
}
