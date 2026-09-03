import { api } from '@/lib/ky'

interface ChangePasswordRequest {
	currentPassword: string
	newPassword: string
}

export async function changePassword({
	currentPassword,
	newPassword,
}: ChangePasswordRequest): Promise<void> {
	await api.patch('api/profile/password', {
		json: {
			currentPassword,
			newPassword,
		},
	})
}
