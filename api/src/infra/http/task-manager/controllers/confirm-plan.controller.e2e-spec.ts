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

describe('Confirm plan [E2E]', () => {
	let app: INestApplication
	let prisma: PrismaService
	let sessionTokenGenerator: SessionTokenGenerator
	let sessionTokenHasher: SessionTokenHasher

	let userId: string
	let taskId: string
	let planId: string
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
		planId = UUIDGenerator(1)[0]
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
				plans: {
					create: {
						id: planId,
						taskId,
						title: '[REVIEW]: Review Auto Guide',
						startsAt: new Date(2026, 0, 12, 9, 0, 0),
						endsAt: new Date(2026, 0, 12, 10, 0, 0),
					},
				},
			},
		})
	})

	it('[POST] /api/plans/:planId/record-as-done', async () => {
		await request(app.getHttpServer())
			.post(`/api/plans/${planId}/record-as-done`)
			.set('Cookie', `${SESSION_COOKIE_NAME}=${sessionToken}`)
			.send({
				timeZone: 'America/Sao_Paulo',
			})
			.expect(204)

		const plan = await prisma.plan.findUnique({ where: { id: planId } })

		const workLog = await prisma.workLog.findFirst({ where: { userId } })

		expect(plan?.confirmedAt).toBeInstanceOf(Date)

		expect(workLog?.title).toBe('[REVIEW]: Review Auto Guide')
		expect(workLog?.taskId).toBe(taskId)
		expect(workLog?.startsAt).toEqual(new Date(2026, 0, 12, 9, 0, 0))
		expect(workLog?.endsAt).toEqual(new Date(2026, 0, 12, 10, 0, 0))
	})

	it('[POST] /api/plans/:planId/record-as-done returns 409 for an already confirmed plan', async () => {
		await request(app.getHttpServer())
			.post(`/api/plans/${planId}/record-as-done`)
			.set('Cookie', `${SESSION_COOKIE_NAME}=${sessionToken}`)
			.send({
				timeZone: 'America/Sao_Paulo',
			})
			.expect(409)
	})

	afterAll(async () => {
		await app.close()
	})
})
