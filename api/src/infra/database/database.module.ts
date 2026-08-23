import { Module } from '@nestjs/common'
import { AccountsRepository } from '@/domain/identity/application/repositories/accounts-repository'
import { SessionsRepository } from '@/domain/identity/application/repositories/sessions-repository'
import { TokensRepository } from '@/domain/identity/application/repositories/tokens-repository'
import { UsersRepository } from '@/domain/identity/application/repositories/users-repository'
import { CategoriesRepository } from '@/domain/task-manager/application/repositories/categories-repository'
import { PlansRepository } from '@/domain/task-manager/application/repositories/plans-repository'
import { TasksRepository } from '@/domain/task-manager/application/repositories/tasks-repository'
import { WorkLogsRepository } from '@/domain/task-manager/application/repositories/work-logs-repository'
import { EnvModule } from '../env/env.module'
import { PrismaService } from './prisma/prisma.service'
import { PrismaAccountsRepository } from './prisma/repositories/prisma-accounts-repository'
import { PrismaCategoriesRepository } from './prisma/repositories/prisma-categories-repository'
import { PrismaPlansRepository } from './prisma/repositories/prisma-plans-repository'
import { PrismaSessionsRepository } from './prisma/repositories/prisma-sessions-repository'
import { PrismaTasksRepository } from './prisma/repositories/prisma-tasks-repository'
import { PrismaTokensRepository } from './prisma/repositories/prisma-tokens-repository'
import { PrismaUsersRepository } from './prisma/repositories/prisma-users-repository'
import { PrismaWorkLogsRepository } from './prisma/repositories/prisma-work-logs-repository'

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
		{
			provide: TasksRepository,
			useClass: PrismaTasksRepository,
		},
		{
			provide: CategoriesRepository,
			useClass: PrismaCategoriesRepository,
		},
		{
			provide: PlansRepository,
			useClass: PrismaPlansRepository,
		},
		{
			provide: WorkLogsRepository,
			useClass: PrismaWorkLogsRepository,
		},
	],
	exports: [
		PrismaService,
		UsersRepository,
		AccountsRepository,
		TokensRepository,
		SessionsRepository,
		TasksRepository,
		CategoriesRepository,
		PlansRepository,
		WorkLogsRepository,
	],
})
export class DatabaseModule {}
