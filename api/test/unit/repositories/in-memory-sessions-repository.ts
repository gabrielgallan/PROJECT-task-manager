import { SessionsRepository } from '@/domain/identity/application/repositories/sessions-repository'
import { Session } from '@/domain/identity/enterprise/entities/session'

export class InMemorySessionsRepository implements SessionsRepository {
	public items: Session[] = []

	async create(session: Session) {
		this.items.push(session)

		return
	}

	async findById(sessionId: string) {
		const session = this.items.find((s) => s.id.toString() === sessionId)

		return session ?? null
	}

	async findByTokenHash(tokenHash: string) {
		const session = this.items.find((s) => s.tokenHash === tokenHash)

		return session ?? null
	}

	async fetchActiveByUserId(userId: string) {
		const sessions = this.items.filter(
			(session) =>
				session.userId.toString() === userId && !session.isExpired() && !session.isRevoked(),
		)

		const orderedByCreatedAt = sessions.sort(
			(a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
		)

		return orderedByCreatedAt
	}

	async revokeAllByUserId(userId: string, revokedAt: Date) {
		let count = 0

		this.items = this.items.map((session) => {
			if (session.userId.toString() !== userId || session.isRevoked() || session.isExpired()) {
				return session
			}

			count++

			return Session.create(
				{
					userId: session.userId,
					tokenHash: session.tokenHash,
					ipAddress: session.ipAddress,
					userAgent: session.userAgent,
					expiresAt: session.expiresAt,
					createdAt: session.createdAt,
					revokedAt,
				},
				session.id,
			)
		})

		return count
	}

	async save(session: Session) {
		const sessionIndex = this.items.findIndex((s) => s.id.toString() === session.id.toString())

		if (sessionIndex >= 0) {
			this.items[sessionIndex] = session
		}

		return
	}
}
