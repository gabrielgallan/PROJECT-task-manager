import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { UUIDGenerator } from 'test/e2e/factories/uuid-generator'
import { Hasher } from '@/domain/identity/application/cryptography/hasher'
import { AppModule } from '@/infra/app.module'
import { SESSION_COOKIE_NAME } from '@/infra/auth/session-cookie'
import { PrismaService } from '@/infra/database/prisma/prisma.service'

describe('Authenticate [E2E]', () => {
	let app: INestApplication
	let prisma: PrismaService
	let hasher: Hasher

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		}).compile()

		app = moduleRef.createNestApplication()

		prisma = moduleRef.get(PrismaService)

		hasher = moduleRef.get(Hasher)

		await app.init()
	})

	it('[POST] /api/sessions', async () => {
		const [userId] = UUIDGenerator(1)

		await prisma.user.create({
			data: {
				id: userId,
				name: 'John Doe',
				email: 'johndoe@email.com',
				jobTitle: '',
				passwordHash: await hasher.generate('johnDoe123'),
			},
		})

		const response = await request(app.getHttpServer())
			.post('/api/sessions')
			.send({
				email: 'johndoe@email.com',
				password: 'johnDoe123',
			})
			.expect(201)

		const sessions = await prisma.session.findMany({ where: { userId } })

		expect(sessions).toHaveLength(1)
		expect(response.headers['set-cookie']).toEqual(
			expect.arrayContaining([expect.stringContaining(`${SESSION_COOKIE_NAME}=`)]),
		)
	})

	afterAll(async () => {
		await app.close()
	})
})
