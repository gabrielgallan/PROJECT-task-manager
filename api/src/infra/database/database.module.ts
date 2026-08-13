import { Module } from '@nestjs/common'
import { InMemoryAccountsRepository } from 'test/unit/repositories/in-memory-accounts-repository'
import { InMemorySessionsRepository } from 'test/unit/repositories/in-memory-sessions-repository'
import { InMemoryTokensRepository } from 'test/unit/repositories/in-memory-tokens-repository'
import { InMemoryUsersRepository } from 'test/unit/repositories/in-memory-users-repository'
import { AccountsRepository } from '@/domain/identity/application/repositories/accounts-repository'
import { SessionsRepository } from '@/domain/identity/application/repositories/sessions-repository'
import { TokensRepository } from '@/domain/identity/application/repositories/tokens-repository'
import { UsersRepository } from '@/domain/identity/application/repositories/users-repository'

@Module({
	providers: [
		{
			provide: UsersRepository,
			useClass: InMemoryUsersRepository,
		},
		{
			provide: AccountsRepository,
			useClass: InMemoryAccountsRepository,
		},
		{
			provide: TokensRepository,
			useClass: InMemoryTokensRepository,
		},
		{
			provide: SessionsRepository,
			useClass: InMemorySessionsRepository,
		},
	],
	exports: [UsersRepository, AccountsRepository, TokensRepository, SessionsRepository],
})
export class DatabaseModule {}
