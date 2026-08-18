import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { apiReference } from '@scalar/nestjs-api-reference'
import { AppModule } from './infra/app.module'
import { EnvService } from './infra/env/env.service'

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		logger: ['error', 'log', 'warn'],
	})

	const config = new DocumentBuilder().setTitle('task_manager API').setVersion('1.0').build()

	const document = SwaggerModule.createDocument(app, config)

	app.use(
		'/reference',
		apiReference({
			theme: 'elysiajs',
			content: document,
			layout: 'classic',
		}),
	)

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
