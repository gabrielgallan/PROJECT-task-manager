import { Module } from '@nestjs/common'
import { AccountsRepository } from '@/domain/identity/application/repositories/accounts-repository'
import { SessionsRepository } from '@/domain/identity/application/repositories/sessions-repository'
import { TokensRepository } from '@/domain/identity/application/repositories/tokens-repository'
import { UsersRepository } from '@/domain/identity/application/repositories/users-repository'
import { EnvModule } from '../env/env.module'
import { PrismaService } from './prisma/prisma.service'
import { PrismaAccountsRepository } from './prisma/repositories/prisma-accounts-repository'
import { PrismaSessionsRepository } from './prisma/repositories/prisma-sessions-repository'
import { PrismaTokensRepository } from './prisma/repositories/prisma-tokens-repository'
import { PrismaUsersRepository } from './prisma/repositories/prisma-users-repository'

@Module({
	imports: [EnvModule],
	providers: [
		PrismaService,
		{
			provide: UsersRepository,
			useClass: PrismaUsersRepository,
		},
		{
			provide: AccountsRepository,
			useClass: PrismaAccountsRepository,
		},
		{
			provide: TokensRepository,
			useClass: PrismaTokensRepository,
		},
		{
			provide: SessionsRepository,
			useClass: PrismaSessionsRepository,
		},
	],
	exports: [PrismaService, UsersRepository, AccountsRepository, TokensRepository, SessionsRepository],
})
export class DatabaseModule {}
