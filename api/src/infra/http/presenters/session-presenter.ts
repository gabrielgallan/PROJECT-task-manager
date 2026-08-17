import { Session } from '@/domain/identity/enterprise/entities/session'

export class SessionPresenter {
	static toHTTP(session: Session) {
		return {
			id: session.id.toString(),
			ipAddress: session.ipAddress ?? null,
			userAgent: session.userAgent ?? null,
			createdAt: session.createdAt,
			revokedAt: session.revokedAt ?? null,
		}
	}
}
