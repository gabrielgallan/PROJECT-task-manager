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

describe('Get task details [E2E]', () => {
	let app: INestApplication
	let prisma: PrismaService
	let sessionTokenGenerator: SessionTokenGenerator
	let sessionTokenHasher: SessionTokenHasher

	let userId: string
	let taskId: string
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
		sessionToken = sessionTokenGenerator.generate()

		vi.useFakeTimers()

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
						title: 'Implement auth feature',
						status: 'IN_PROGRESS',
						priority: 'HIGH',
						plans: {
							createMany: {
								data: [
									{
										userId,
										title: 'Add JWT guard',
										startsAt: new Date(2026, 0, 12, 9, 0, 0),
										endsAt: new Date(2026, 0, 12, 10, 0, 0),
									},
									{
										userId,
										title: 'Configure JWT public and private keys',
										startsAt: new Date(2026, 0, 13, 9, 0, 0),
										endsAt: new Date(2026, 0, 13, 10, 0, 0),
									},
									{
										userId,
										title: 'Add token in cookies http-only',
										startsAt: new Date(2026, 0, 13, 13, 0, 0),
										endsAt: new Date(2026, 0, 13, 14, 0, 0),
									},
								],
							},
						},
						workLogs: {
							create: {
								userId,
								title: 'Add users password hashing feat',
								startsAt: new Date(2026, 0, 13, 14, 0, 0),
								endsAt: new Date(2026, 0, 13, 15, 0, 0),
							},
						},
					},
				},
			},
		})
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('[GET] /api/tasks/:taskId', async () => {
		const response = await request(app.getHttpServer())
			.get(`/api/tasks/${taskId}`)
			.set('Cookie', `${SESSION_COOKIE_NAME}=${sessionToken}`)
			.expect(200)

		expect(response.body.data.summary).toMatchObject({
			plannedMinutes: 180,
			loggedMinutes: 60,
		})

		expect(response.body.data.activity).toHaveLength(4)
	})

	afterAll(async () => {
		await app.close()
	})
})
