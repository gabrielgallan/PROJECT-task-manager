import { randomBytes } from 'node:crypto'
import { SessionTokenGenerator } from '@/domain/identity/application/cryptography/session-token-generator'

export class SessionTokenGeneratorStub implements SessionTokenGenerator {
	generate(): string {
		return randomBytes(32).toString('base64url')
	}
}
