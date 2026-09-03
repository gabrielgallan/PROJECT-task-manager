import { api } from '@/lib/ky'

interface AuthenticateWithGithubRequest {
	code: string
}

interface AuthenticateWithGithubResponse {
	success: boolean
}

export async function authenticateWithGithub({
	code,
}: AuthenticateWithGithubRequest): Promise<AuthenticateWithGithubResponse> {
	return await api
		.post('api/sessions/github', {
			json: {
				code,
			},
		})
		.json<AuthenticateWithGithubResponse>()
}
