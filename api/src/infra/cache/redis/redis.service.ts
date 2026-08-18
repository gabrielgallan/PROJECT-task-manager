import { Injectable, OnModuleDestroy } from '@nestjs/common'
import Redis from 'ioredis'
import { EnvService } from '@/infra/env/env.service'

@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
	constructor(env: EnvService) {
		super(env.get('REDIS_URL'), {
			maxRetriesPerRequest: 3,
			enableReadyCheck: true,
		})

		this.on('error', (err) => {
			console.error(err)
		})
	}

	onModuleDestroy() {
		this.disconnect()
	}
}
