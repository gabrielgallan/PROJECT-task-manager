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

describe('Fetch plans [E2E]', () => {
	let app: INestApplication
	let prisma: PrismaService
	let sessionTokenGenerator: SessionTokenGenerator
	let sessionTokenHasher: SessionTokenHasher

	let userId: string
	let taskId: string
	let categoryId: string
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
		taskId = UUIDGenerator(1)[0]
		categoryId = UUIDGenerator(1)[0]
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
				tasks: {
					create: {
						id: taskId,
						title: 'Review Auto Guide',
					},
				},
				categories: {
					create: {
						id: categoryId,
						name: 'Guides',
						color: 'green',
					},
				},
				plans: {
					createMany: {
						data: [
							{
								title: '[REVIEW]: Review User Guide',
								taskId,
								categoryId,
								startsAt: new Date(2026, 0, 12, 9, 0, 0),
								endsAt: new Date(2026, 0, 12, 10, 0, 0),
							},
							{
								title: '[APP]: Fix notifications feature',
								startsAt: new Date(2026, 0, 12, 14, 0, 0),
								endsAt: new Date(2026, 0, 12, 16, 0, 0),
							},
							{
								title: '[STUDY]: Udemy Microservices Course',
								startsAt: new Date(2026, 0, 13, 9, 0, 0),
								endsAt: new Date(2026, 0, 13, 11, 0, 0),
							},
						],
					},
				},
			},
		})
	})

	it('[GET] /api/plans', async () => {
		const response = await request(app.getHttpServer())
			.get('/api/plans')
			.set('Cookie', `${SESSION_COOKIE_NAME}=${sessionToken}`)
			.query({
				from: new Date(2026, 0, 12, 0, 0, 0).toISOString(),
				to: new Date(2026, 0, 12, 23, 59, 0).toISOString(),
			})
			.expect(200)

		expect(response.body.data).toHaveLength(2)

		expect(response.body.data[0]).toMatchObject({
			title: '[REVIEW]: Review User Guide',
			task: { id: taskId, title: 'Review Auto Guide' },
			category: { id: categoryId, name: 'Guides', color: 'green' },
			confirmedAt: null,
		})

		expect(response.body.data[1]).toMatchObject({
			title: '[APP]: Fix notifications feature',
			task: null,
			category: null,
		})
	})

	afterAll(async () => {
		await app.close()
	})
})
