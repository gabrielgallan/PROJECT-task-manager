import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { apiReference } from '@scalar/nestjs-api-reference'
import { AppModule } from './infra/app.module'
import { EnvService } from './infra/env/env.service'

async function bootstrap() {
	const app = await NestFactory.create(AppModule)

	const logger = new Logger('MAIN')

	const env = app.get(EnvService)

	app.enableCors({
		origin: (origin: string, callback: (err: Error | null, allow?: boolean) => void) => {
			if (!origin) return callback(null, true)

			const allowedOrigins = env.get('CORS_ORIGINS').split(',')

			if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
				callback(null, true)
			} else {
				callback(new Error('Not allowed by CORS'))
			}
		},
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
		allowedHeaders: [
			'Content-Type',
			'Authorization',
			'X-Requested-With',
			'Accept',
			'Origin',
			'Access-Control-Request-Method',
			'Access-Control-Request-Headers',
		],
		credentials: true,
		maxAge: 86400,
	})

	if (env.get('NODE_ENV') !== 'production') {
		const config = new DocumentBuilder()
			.setTitle('task_manager API')
			.setVersion('1.0')
			.setLicense('MIT', 'https://opensource.org/licenses/MIT')
			.addBearerAuth({
				type: 'http',
				scheme: 'bearer',
				bearerFormat: 'JWT',
				name: 'JWT',
				description: 'Enter JWT token',
				in: 'header',
			})
			.addTag('Authentication', 'Authentication related endpoints')
			.addTag('Profile', 'Profile related endpoints')
			.addTag('Tasks', 'Tasks related endpoints')
			.addTag('Plans', 'Plans related endpoints')
			.addTag('Work-logs', 'Work-logs related endpoints')
			.addTag('Categories', 'Categories related endpoints')
			.build()

		const document = SwaggerModule.createDocument(app, config)

		const httpAdapter = app.getHttpAdapter()

		httpAdapter.get('/api/reference/openapi.json', (_req, res) => {
			res.json(document)
		})

		app.use(
			'/api/reference',
			apiReference({
				url: '/reference/openapi.json',
				theme: 'elysiajs',
				layout: 'modern',
			}),
		)
	}

	const port = env.get('PORT')

	app
		.listen(port)
		.catch((error) => {
			logger.error('Error starting HTTP server', error)

			process.exit(1)
		})
		.finally(() => {
			logger.log(`HTTP server running on http://localhost:${port}`)
			logger.log(`API documentation can be found on http://localhost:${port}/api/reference`)
			logger.log(
				`API openapi.json can be found on http://localhost:${port}/api/reference/openapi.json`,
			)
		})
}
bootstrap()
