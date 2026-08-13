import { randomBytes } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import { SessionTokenGenerator } from '@/domain/identity/application/cryptography/session-token-generator'

@Injectable()
export class NodeSessionTokenGenerator implements SessionTokenGenerator {
	generate(): string {
		return randomBytes(32).toString('base64url')
	}
}
