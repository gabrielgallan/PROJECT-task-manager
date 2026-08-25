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

describe('Create work-log [E2E]', () => {
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
			},
		})
	})

	it('[POST] /api/work-logs', async () => {
		vi.setSystemTime(new Date(2026, 0, 13, 12))

		await request(app.getHttpServer())
			.post('/api/work-logs')
			.set('Cookie', `${SESSION_COOKIE_NAME}=${sessionToken}`)
			.send({
				title: '[REVIEW]: Review Auto Guide - part 1',
				taskId,
				categoryId,
				startsAt: new Date(2026, 0, 12, 15, 30, 0).toISOString(),
				endsAt: new Date(2026, 0, 12, 16, 30, 0).toISOString(),
				timeZone: 'America_SaoPaulo',
			})
			.expect(201)
	})

	afterAll(async () => {
		await app.close()
	})
})
