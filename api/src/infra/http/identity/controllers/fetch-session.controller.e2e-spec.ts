import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { addDays } from 'date-fns'
import request from 'supertest'
import { SessionTokenGenerator } from '@/domain/identity/application/cryptography/session-token-generator'
import { SessionTokenHasher } from '@/domain/identity/application/cryptography/session-token-hasher'
import { AppModule } from '@/infra/app.module'
import { SESSION_COOKIE_NAME } from '@/infra/auth/session-cookie'
import { PrismaService } from '@/infra/database/prisma/prisma.service'

describe('Fetch user sessions [E2E]', () => {
	let app: INestApplication
	let prisma: PrismaService
	let sessionTokenGenerator: SessionTokenGenerator
	let sessionTokenHasher: SessionTokenHasher

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		}).compile()

		app = moduleRef.createNestApplication()

		prisma = moduleRef.get(PrismaService)

		sessionTokenGenerator = moduleRef.get(SessionTokenGenerator)

		sessionTokenHasher = moduleRef.get(SessionTokenHasher)

		await app.init()
	})

	it('[GET] /api/sessions', async () => {
		const sessionToken = sessionTokenGenerator.generate()

		await prisma.user.create({
			data: {
				name: 'John Doe',
				email: 'johndoe@email.com',
				jobTitle: 'Developer',
				sessions: {
					createMany: {
						data: [
							{
								tokenHash: sessionTokenHasher.hash(sessionToken),
								expiresAt: addDays(new Date(), 30),
							},
							{
								tokenHash: sessionTokenHasher.hash(sessionTokenGenerator.generate()),
								expiresAt: addDays(new Date(), 25),
							},
							{
								tokenHash: sessionTokenHasher.hash(sessionTokenGenerator.generate()),
								expiresAt: addDays(new Date(), 20),
							},
						],
					},
				},
			},
		})

		const response = await request(app.getHttpServer())
			.get('/api/sessions')
			.set('Cookie', `${SESSION_COOKIE_NAME}=${sessionToken}`)
			.expect(200)

		expect(response.body.sessions).toHaveLength(3)
	})

	afterAll(async () => {
		await app.close()
	})
})
