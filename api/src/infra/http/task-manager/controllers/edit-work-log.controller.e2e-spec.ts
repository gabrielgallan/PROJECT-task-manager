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

describe('Edit work-log [E2E]', () => {
	let app: INestApplication
	let prisma: PrismaService
	let sessionTokenGenerator: SessionTokenGenerator
	let sessionTokenHasher: SessionTokenHasher

	let userId: string
	let taskId: string
	let categoryId: string
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
		taskId = UUIDGenerator(1)[0]
		categoryId = UUIDGenerator(1)[0]
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
				workLogs: {
					create: {
						id: workLogId,
						title: '[REVIEW]: Review Auto Guide',
						startsAt: new Date(2026, 0, 12, 9, 0, 0),
						endsAt: new Date(2026, 0, 12, 10, 0, 0),
					},
				},
			},
		})
	})

	it('[PUT] /api/work-logs/:workLogId', async () => {
		await request(app.getHttpServer())
			.put(`/api/work-logs/${workLogId}`)
			.set('Cookie', `${SESSION_COOKIE_NAME}=${sessionToken}`)
			.send({
				title: '[REVIEW]: Review Auto Guide - part 1',
				taskId,
				categoryId,
				startsAt: new Date(2026, 0, 12, 9, 0, 0).toISOString(),
				endsAt: new Date(2026, 0, 12, 11, 30, 0).toISOString(),
				timeZone: 'America/Sao_Paulo',
			})
			.expect(204)

		const workLog = await prisma.workLog.findUnique({ where: { id: workLogId } })

		expect(workLog?.title).toBe('[REVIEW]: Review Auto Guide - part 1')
		expect(workLog?.taskId).toBe(taskId)
		expect(workLog?.categoryId).toBe(categoryId)
		expect(workLog?.endsAt).toEqual(new Date(2026, 0, 12, 11, 30, 0))
	})

	afterAll(async () => {
		await app.close()
	})
})
