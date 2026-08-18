import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '@/infra/app.module'

describe('Register [E2E]', () => {
	let app: INestApplication

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		}).compile()

		app = moduleRef.createNestApplication()
		await app.init()
	})

	it('[POST] /api/users', async () => {
		return request(app.getHttpServer())
			.post('/api/users')
			.send({
				name: 'John Doe',
				email: 'johndoe@email.com',
				password: 'johnDoe123',
			})
			.expect(201)
			.expect({ success: true })
	})

	afterAll(async () => {
		await app.close()
	})
})
