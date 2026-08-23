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

describe('Fetch tasks [E2E]', () => {
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
				tasks: {
					createMany: {
						data: [
							{
								title: 'Fix auth feat',
								status: 'IN_PROGRESS',
								priority: 'HIGH',
							},
							{
								title: 'Add session feat',
								status: 'DONE',
								priority: 'LOW',
							},
							{
								title: 'Remove JWT feat',
								status: 'BACKLOG',
								priority: 'MEDIUM',
							},
						],
					},
				},
			},
		})
	})

	it('[GET] /api/tasks', async () => {
		const tasksByStatus = await request(app.getHttpServer())
			.get('/api/tasks')
			.set('Cookie', `${SESSION_COOKIE_NAME}=${sessionToken}`)
			.query({
				status: 'BACKLOG',
			})
			.expect(200)

		const tasksByPriority = await request(app.getHttpServer())
			.get('/api/tasks')
			.set('Cookie', `${SESSION_COOKIE_NAME}=${sessionToken}`)
			.query({
				priority: 'HIGH',
			})
			.expect(200)

		expect(tasksByStatus.body.data).toHaveLength(1)
		expect(tasksByPriority.body.data).toHaveLength(1)
	})

	afterAll(async () => {
		await app.close()
	})
})
