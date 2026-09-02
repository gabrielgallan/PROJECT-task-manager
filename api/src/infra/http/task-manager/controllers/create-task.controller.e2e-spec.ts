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

describe('Crate task [E2E]', () => {
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

	it('[POST] /api/tasks', async () => {
		const sessionToken = sessionTokenGenerator.generate()

		const [userId] = UUIDGenerator(1)

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
			},
		})

		const response = await request(app.getHttpServer())
			.post('/api/tasks')
			.set('Cookie', `${SESSION_COOKIE_NAME}=${sessionToken}`)
			.send({
				title: 'Fix auth feature',
				status: 'BACKLOG',
				priority: 'MEDIUM',
				startDate: '2026-08-26',
				dueDate: '2026-08-28',
			})
			.expect(201)

		const task = await prisma.task.findFirst({
			where: {
				userId,
			},
		})

		expect(response.body.data).toMatchObject({
			id: task?.id,
			title: 'Fix auth feature',
			status: 'BACKLOG',
			priority: 'MEDIUM',
		})

		expect(task?.title).toBe('Fix auth feature')
		expect(task?.status).toBe('BACKLOG')
		expect(task?.priority).toBe('MEDIUM')
		expect(task?.startDate).toEqual(new Date('2026-08-26'))
		expect(task?.dueDate).toEqual(new Date('2026-08-28'))
	})

	afterAll(async () => {
		await app.close()
	})
})
