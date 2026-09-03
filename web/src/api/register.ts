import { api } from '@/lib/ky'

interface RegisterRequest {
	name: string
	email: string
	password: string
	jobTitle?: string
}

interface RegisterResponse {
	success: boolean
}

export async function register({
	name,
	email,
	password,
	jobTitle,
}: RegisterRequest): Promise<RegisterResponse> {
	return await api
		.post('api/users', {
			json: {
				name,
				email,
				password,
				jobTitle,
			},
		})
		.json<RegisterResponse>()
}
