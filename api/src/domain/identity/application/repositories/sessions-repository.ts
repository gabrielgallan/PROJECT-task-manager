import type { Session } from '../../enterprise/entities/session'

export abstract class SessionsRepository {
	abstract create(session: Session): Promise<void>
	abstract findByTokenHash(tokenHash: string): Promise<Session | null>
}
