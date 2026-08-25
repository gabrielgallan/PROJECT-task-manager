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

describe('Fetch work-logs [E2E]', () => {
	let app: INestApplication
	let prisma: PrismaService
	let sessionTokenGenerator: SessionTokenGenerator
	let sessionTokenHasher: SessionTokenHasher

	let userId: string
	let sessionToken: string

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		}).compile()

		app = moduleRef.createNestApplication()

		prisma = moduleRef.get(PrismaService)

		sessionTokenGenerator = moduleRef.get(SessionTokenGenerator)

		sessionTokenHasher = moduleRef.get(SessionTokenHasher)

		await app.init()

		userId = UUIDGenerator(1)[0]
		sessionToken = sessionTokenGenerator.generate()

		await prisma.user.create({
			data: {
				id: userId,
				name: 'John Doe',
				email: 'johndoe@email.com',
				jobTitle: 'Developer',
				sessions: {
					create: {
						tokenHash: sessionTokenHasher.hash(sessionToken),
						expiresAt: addDays(new Date(), 30),
					},
				},
				workLogs: {
					createMany: {
						data: [
							{
								title: '[REVIEW]: Review User Guide',
								startsAt: new Date(2026, 0, 12, 9, 0, 0),
								endsAt: new Date(2026, 0, 12, 10, 0, 0),
							},
							{
								title: '[APP]: Fix notifications feature',
								startsAt: new Date(2026, 0, 12, 10, 0, 0),
								endsAt: new Date(2026, 0, 12, 12, 0, 0),
							},
							{
								title: '[DOCS]: Update APP docs',
								startsAt: new Date(2026, 0, 12, 13, 0, 0),
								endsAt: new Date(2026, 0, 12, 15, 0, 0),
							},
							{
								title: '[STUDY]: Udemy Microservices Course',
								startsAt: new Date(2026, 0, 12, 15, 0, 0),
								endsAt: new Date(2026, 0, 12, 17, 0, 0),
							},
							{
								title: '[REVIE]: Review Auto Guide',
								startsAt: new Date(2026, 0, 13, 11, 0, 0),
								endsAt: new Date(2026, 0, 13, 12, 0, 0),
							},
						],
					},
				},
			},
		})
	})

	it('[GET] /api/work-logs', async () => {
		const response = await request(app.getHttpServer())
			.get('/api/work-logs')
			.set('Cookie', `${SESSION_COOKIE_NAME}=${sessionToken}`)
			.query({
				from: new Date(2026, 0, 12, 0, 0, 0),
				to: new Date(2026, 0, 12, 23, 59, 0),
			})
			.expect(200)

		expect(response.body.data).toHaveLength(4)
	})

	afterAll(async () => {
		await app.close()
	})
})
