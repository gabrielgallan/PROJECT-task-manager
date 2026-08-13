import { createHash } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import { SessionTokenHasher } from '@/domain/identity/application/cryptography/session-token-hasher'

@Injectable()
export class NodeSessionTokenHasher implements SessionTokenHasher {
	hash(token: string): string {
		return createHash('sha256').update(token).digest('hex')
	}
}
