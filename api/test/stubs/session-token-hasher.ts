import { createHash } from 'node:crypto'
import { SessionTokenHasher } from '@/domain/identity/application/cryptography/session-token-hasher'

export class SessionTokenHasherStub implements SessionTokenHasher {
	hash(token: string): string {
		return createHash('sha256').update(token).digest('hex')
	}
}
