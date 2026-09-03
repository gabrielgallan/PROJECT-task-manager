import { api } from '@/lib/ky'

interface FetchSessionsResponse {
	sessions: {
		id: string
		ipAddress: string | null
		userAgent: {
			osName?: string
			osVersion?: string
			browserName?: string
			deviceType?: string
		} | null
		isCurrent: boolean
		createdAt: string
		revokedAt: string | null
	}[]
}

export async function fetchSessions(): Promise<FetchSessionsResponse> {
	return await api.get('api/sessions').json<FetchSessionsResponse>()
}
