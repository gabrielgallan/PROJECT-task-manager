import { api } from '@/lib/ky'

interface ResetPasswordRequest {
	tokenId: string
	password: string
}

export async function resetPassword({ tokenId, password }: ResetPasswordRequest): Promise<void> {
	await api.patch('api/profile/password-recover', {
		json: {
			tokenId,
			password,
		},
	})
}
