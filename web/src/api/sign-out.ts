import { api } from '@/lib/ky'

export async function signOut(): Promise<void> {
	await api.post('api/sign-out')
}
