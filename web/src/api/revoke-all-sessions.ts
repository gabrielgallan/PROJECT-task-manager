import { api } from '@/lib/ky'

interface RevokeAllSessionsResponse {
	sessionsCount: number
}

export async function revokeAllSessions(): Promise<RevokeAllSessionsResponse> {
	return await api.delete('api/sessions').json<RevokeAllSessionsResponse>()
}
