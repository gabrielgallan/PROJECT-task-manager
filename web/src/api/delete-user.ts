import { api } from '@/lib/ky'

export async function deleteUser(): Promise<void> {
	await api.delete('api/profile')
}
