import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient } from '@/../generated/prisma/client'
import { EnvService } from '@/infra/env/env.service'

@Injectable()
export class PrismaService
	extends PrismaClient
	implements OnModuleInit, OnModuleDestroy
{
	constructor(env: EnvService) {
		const connectionString = env.get('DATABASE_URL')

		// O driver `pg` ignora o parametro `?schema=` da connection string, entao
		// o schema precisa ser aplicado no `search_path` da conexao.
		const schema =
			new URL(connectionString).searchParams.get('schema') ?? undefined

		const adapter = new PrismaPg(
			{
				connectionString,
				options: schema ? `-c search_path="${schema}"` : undefined,
			},
			{ schema },
		)

		super({
			adapter,
			log: ['error', 'warn'],
		})
	}

	async onModuleInit() {
		await this.$connect()
	}

	async onModuleDestroy() {
		await this.$disconnect()
	}
}
