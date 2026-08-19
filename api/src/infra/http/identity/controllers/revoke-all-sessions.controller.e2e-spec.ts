import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { addDays } from 'date-fns'
import request from 'supertest'
import { SessionTokenGenerator } from '@/domain/identity/application/cryptography/session-token-generator'
import { SessionTokenHasher } from '@/domain/identity/application/cryptography/session-token-hasher'
import { AppModule } from '@/infra/app.module'
import { SESSION_COOKIE_NAME } from '@/infra/auth/session-cookie'
import { PrismaService } from '@/infra/database/prisma/prisma.service'

describe('Revoke all sessions [E2E]', () => {
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

	it('[DELETE] /api/sessions', async () => {
		const sessionToken = sessionTokenGenerator.generate()

		const user = await prisma.user.create({
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

		await request(app.getHttpServer())
			.delete('/api/sessions')
			.set('Cookie', `${SESSION_COOKIE_NAME}=${sessionToken}`)
			.expect(200)
			.expect({
				sessionsCount: 3,
			})

		const sessions = await prisma.session.findMany({
			where: { userId: user.id },
		})

		expect(sessions).toEqual([
			expect.objectContaining({
				revokedAt: expect.any(Date),
			}),
			expect.objectContaining({
				revokedAt: expect.any(Date),
			}),
			expect.objectContaining({
				revokedAt: expect.any(Date),
			}),
		])
	})

	afterAll(async () => {
		await app.close()
	})
})
