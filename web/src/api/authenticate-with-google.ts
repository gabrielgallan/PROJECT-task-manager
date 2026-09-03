import { api } from '@/lib/ky'

interface AuthenticateWithGoogleRequest {
	code: string
}

interface AuthenticateWithGoogleResponse {
	success: boolean
}

export async function authenticateWithGoogle({
	code,
}: AuthenticateWithGoogleRequest): Promise<AuthenticateWithGoogleResponse> {
	return await api
		.post('api/sessions/google', {
			json: {
				code,
			},
		})
		.json<AuthenticateWithGoogleResponse>()
}
