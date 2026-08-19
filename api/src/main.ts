import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { apiReference } from '@scalar/nestjs-api-reference'
import { AppModule } from './infra/app.module'
import { EnvService } from './infra/env/env.service'

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		logger: ['error', 'warn', 'log', 'verbose'],
		cors: true,
	})

	const config = new DocumentBuilder().setTitle('task_manager API').setVersion('1.0').build()

	const document = SwaggerModule.createDocument(app, config)

	const httpAdapter = app.getHttpAdapter()

	httpAdapter.get('/reference/openapi.json', (_req, res) => {
		res.json(document)
	})

	app.use(
		'/reference',
		apiReference({
			url: '/reference/openapi.json',
			theme: 'elysiajs',
			layout: 'modern',
		}),
	)

	const logger = new Logger('MAIN')

	const envService = app.get(EnvService)

	const port = envService.get('PORT')

	app
		.listen(port)
		.catch((error) => {
			logger.error('Error starting HTTP server', error)

			process.exit(1)
		})
		.finally(() => {
			logger.verbose(`HTTP server running on port ${port}`)
			logger.verbose(`API documentation can be found on /reference`)
			logger.verbose(`API openapi.json can be found on /reference/openapi.json`)
		})
}
bootstrap()
