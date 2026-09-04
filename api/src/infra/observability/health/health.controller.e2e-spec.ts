import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '@/infra/app.module'

describe('Get health [E2E]', () => {
	let app: INestApplication

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		}).compile()

		app = moduleRef.createNestApplication()

		await app.init()
	})

	it('[GET] /api/health', async () => {
		const response = await request(app.getHttpServer()).get('/api/health').expect(200)

		expect(response.body).toEqual(
			expect.objectContaining({
				status: 'ok',
				timestamp: expect.any(String),
				uptime: expect.any(Number),
				memory: expect.objectContaining({
					rss: expect.any(Number),
					heapTotal: expect.any(Number),
					heapUsed: expect.any(Number),
					external: expect.any(Number),
					arrayBuffers: expect.any(Number),
				}),
				version: expect.any(String),
			}),
		)
	})

	afterAll(async () => {
		await app.close()
	})
})
