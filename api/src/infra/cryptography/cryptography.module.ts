import { Module } from '@nestjs/common'
import { Hasher } from '@/domain/identity/application/cryptography/hasher'
import { SessionTokenGenerator } from '@/domain/identity/application/cryptography/session-token-generator'
import { SessionTokenHasher } from '@/domain/identity/application/cryptography/session-token-hasher'
import { BcryptHasher } from './bcrypt-hasher'
import { NodeSessionTokenGenerator } from './node-session-token-generator'
import { NodeSessionTokenHasher } from './node-session-token-hasher'

@Module({
	providers: [
		{
			provide: SessionTokenGenerator,
			useClass: NodeSessionTokenGenerator,
		},
		{
			provide: SessionTokenHasher,
			useClass: NodeSessionTokenHasher,
		},
		{
			provide: Hasher,
			useClass: BcryptHasher,
		},
	],
	exports: [SessionTokenGenerator, SessionTokenHasher, Hasher],
})
export class CryptographyModule {}
