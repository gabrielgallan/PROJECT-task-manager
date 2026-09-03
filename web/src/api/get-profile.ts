import { api } from '@/lib/ky'

interface GetProfileResponse {
	profile: {
		name: string | null
		email: string
		jobTitle: string | null
		avatarUrl: string | null
	}
}

export async function getProfile(): Promise<GetProfileResponse> {
	return await api.get('api/profile').json<GetProfileResponse>()
}
