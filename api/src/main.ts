import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './infra/app.module'
import { EnvService } from './infra/env/env.service'

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		logger: ['error', 'log', 'warn'],
	})

	const logger = new Logger()

	const envService = app.get(EnvService)

	const port = envService.get('PORT')

	app
		.listen(port)
		.catch((error) => {
			logger.error('Error starting HTTP server', error)

			process.exit(1)
		})
		.finally(() => {
			logger.log(`HTTP server running on port ${port}`)
		})
}
bootstrap()
