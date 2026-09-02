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

describe('Create plan [E2E]', () => {
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
			},
		})
	})

	it('[POST] /api/plans', async () => {
		const startsAt = addDays(new Date(), 2)

		const endsAt = addDays(new Date(), 3)

		const response = await request(app.getHttpServer())
			.post('/api/plans')
			.set('Cookie', `${SESSION_COOKIE_NAME}=${sessionToken}`)
			.send({
				title: '[REVIEW]: Review Auto Guide',
				taskId,
				categoryId,
				startsAt: startsAt.toISOString(),
				endsAt: endsAt.toISOString(),
			})
			.expect(201)

		const plan = await prisma.plan.findUnique({ where: { id: response.body.data.id } })

		expect(response.body.data).toMatchObject({
			title: '[REVIEW]: Review Auto Guide',
			taskId,
			categoryId,
			confirmedAt: null,
		})

		expect(plan?.title).toBe('[REVIEW]: Review Auto Guide')
		expect(plan?.userId).toBe(userId)
		expect(plan?.endsAt).toEqual(endsAt)
	})

	it('[POST] /api/plans returns 404 for a task owned by another user', async () => {
		const [otherUserId, otherTaskId] = UUIDGenerator(2)

		await prisma.user.create({
			data: {
				id: otherUserId,
				name: 'Jane Doe',
				email: 'janedoe@email.com',
				jobTitle: 'Designer',
				tasks: {
					create: {
						id: otherTaskId,
						title: 'Redesign landing page',
					},
				},
			},
		})

		await request(app.getHttpServer())
			.post('/api/plans')
			.set('Cookie', `${SESSION_COOKIE_NAME}=${sessionToken}`)
			.send({
				title: '[REVIEW]: Review Auto Guide',
				taskId: otherTaskId,
				startsAt: addDays(new Date(), 2).toISOString(),
				endsAt: addDays(new Date(), 3).toISOString(),
			})
			.expect(404)
	})

	afterAll(async () => {
		await app.close()
	})
})
