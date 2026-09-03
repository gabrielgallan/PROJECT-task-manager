import { api } from '@/lib/ky'

interface RequestPasswordRecoverRequest {
	email: string
}

export async function requestPasswordRecover({
	email,
}: RequestPasswordRecoverRequest): Promise<void> {
	await api.post('api/profile/password-recover', {
		json: {
			email,
		},
	})
}
