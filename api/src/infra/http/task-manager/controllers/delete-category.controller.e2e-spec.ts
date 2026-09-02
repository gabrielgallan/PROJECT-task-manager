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

describe('Delete category [E2E]', () => {
	let app: INestApplication
	let prisma: PrismaService
	let sessionTokenGenerator: SessionTokenGenerator
	let sessionTokenHasher: SessionTokenHasher

	let userId: string
	let categoryId: string
	let planId: string
	let workLogId: string
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
		categoryId = UUIDGenerator(1)[0]
		planId = UUIDGenerator(1)[0]
		workLogId = UUIDGenerator(1)[0]
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
				categories: {
					create: {
						id: categoryId,
						name: 'Work Meeting',
						color: 'blue',
						plans: {
							create: {
								id: planId,
								userId,
								title: 'Integrator Meeting',
								startsAt: new Date(2026, 0, 12, 9, 0, 0),
								endsAt: new Date(2026, 0, 12, 10, 0, 0),
							},
						},
						workLogs: {
							create: {
								id: workLogId,
								userId,
								title: 'Guide Review',
								startsAt: new Date(2026, 0, 12, 10, 0, 0),
								endsAt: new Date(2026, 0, 12, 11, 0, 0),
							},
						},
					},
				},
			},
		})
	})

	it('[DELETE] /api/categories/:categoryId', async () => {
		await request(app.getHttpServer())
			.delete(`/api/categories/${categoryId}`)
			.set('Cookie', `${SESSION_COOKIE_NAME}=${sessionToken}`)
			.expect(204)

		const category = await prisma.category.findUnique({ where: { id: categoryId } })

		const plan = await prisma.plan.findUnique({ where: { id: planId } })

		const workLog = await prisma.workLog.findUnique({ where: { id: workLogId } })

		expect(category).toBeNull()

		expect(plan?.categoryId).toBeNull()
		expect(workLog?.categoryId).toBeNull()
	})

	afterAll(async () => {
		await app.close()
	})
})
