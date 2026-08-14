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
		const adapter = new PrismaPg({
			connectionString: env.get('DATABASE_URL'),
		})

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