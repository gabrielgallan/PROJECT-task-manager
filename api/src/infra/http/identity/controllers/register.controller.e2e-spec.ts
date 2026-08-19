import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '@/infra/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'

describe('Register [E2E]', () => {
	let app: INestApplication
	let prisma: PrismaService

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		}).compile()

		prisma = moduleRef.get(PrismaService)

		app = moduleRef.createNestApplication()

		await app.init()
	})

	it('[POST] /api/users', async () => {
		await request(app.getHttpServer())
			.post('/api/users')
			.send({
				name: 'John Doe',
				email: 'johndoe@email.com',
				password: 'johnDoe123',
			})
			.expect(201)
			.expect({ success: true })

		const user = await prisma.user.findUnique({
			where: {
				email: 'johndoe@email.com',
			},
		})

		expect(user).toBeTruthy()
	})

	afterAll(async () => {
		await app.close()
	})
})
