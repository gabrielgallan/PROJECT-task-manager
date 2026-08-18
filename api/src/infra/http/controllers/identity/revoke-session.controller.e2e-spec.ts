import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { addDays } from 'date-fns'
import request from 'supertest'
import { UUIDGenerator } from 'test/e2e/factories/uuid-generator'
import { SessionTokenGenerator } from '@/domain/identity/application/cryptography/session-token-generator'
import { SessionTokenHasher } from '@/domain/identity/application/cryptography/session-token-hasher'
import { AppModule } from '@/infra/app.module'
import { SESSION_COOKIE_NAME } from '@/infra/auth/session-cookie'
import { PrismaService } from '@/infra/database/prisma/prisma.service'

describe('Revoke session by ID [E2E]', () => {
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

	it('[DELETE] /api/sessions/:sessionId', async () => {
		const sessionToken = sessionTokenGenerator.generate()

		const [sessionId] = UUIDGenerator(1)

		await prisma.user.create({
			data: {
				email: 'johndoe@email.com',
				sessions: {
					createMany: {
						data: [
							{
								tokenHash: sessionTokenHasher.hash(sessionToken),
								expiresAt: addDays(new Date(), 30),
							},
							{
								id: sessionId,
								tokenHash: sessionTokenHasher.hash(sessionTokenGenerator.generate()),
								expiresAt: addDays(new Date(), 20),
							},
						],
					},
				},
			},
		})

		await request(app.getHttpServer())
			.delete(`/api/sessions/${sessionId}`)
			.set('Cookie', `${SESSION_COOKIE_NAME}=${sessionToken}`)
			.expect(204)

		const session = await prisma.session.findUnique({
			where: { id: sessionId },
		})

		expect(session?.revokedAt).toEqual(expect.any(Date))
	})

	afterAll(async () => {
		await app.close()
	})
})
