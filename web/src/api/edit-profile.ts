import { api } from '@/lib/ky'

interface EditProfileRequest {
	name?: string | null
	jobTitle?: string | null
}

export async function editProfile({ name, jobTitle }: EditProfileRequest): Promise<void> {
	await api.put('api/profile', {
		json: {
			name,
			jobTitle,
		},
	})
}
