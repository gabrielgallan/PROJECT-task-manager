import { api } from '@/lib/ky'

interface AuthenticateRequest {
	email: string
	password: string
}

interface AuthenticateResponse {
	success: boolean
}

export async function authenticate({
	email,
	password,
}: AuthenticateRequest): Promise<AuthenticateResponse> {
	return await api
		.post('api/sessions', {
			json: {
				email,
				password,
			},
		})
		.json<AuthenticateResponse>()
}
