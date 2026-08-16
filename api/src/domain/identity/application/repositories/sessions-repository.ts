import type { Session } from '../../enterprise/entities/session'

export abstract class SessionsRepository {
	abstract create(session: Session): Promise<void>
	abstract findById(sessionId: string): Promise<Session | null>
	abstract findByTokenHash(tokenHash: string): Promise<Session | null>
	abstract fetchByUserId(userId: string): Promise<Session[]>
	abstract revokeAllByUserId(userId: string, revokedAt: Date): Promise<number>
	abstract save(session: Session): Promise<void>
}
