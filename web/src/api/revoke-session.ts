import { api } from '@/lib/ky'

interface RevokeSessionRequest {
	sessionId: string
}

export async function revokeSession({ sessionId }: RevokeSessionRequest): Promise<void> {
	await api.delete(`api/sessions/${encodeURIComponent(sessionId)}`)
}
