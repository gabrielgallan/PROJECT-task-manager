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

describe('Edit task [E2E]', () => {
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
						title: 'Fix auth feat',
						status: 'IN_PROGRESS',
						priority: 'HIGH',
					},
				},
			},
		})
	})

	it('[PUT] /api/tasks/:taskId', async () => {
		await request(app.getHttpServer())
			.put(`/api/tasks/${taskId}`)
			.set('Cookie', `${SESSION_COOKIE_NAME}=${sessionToken}`)
			.send({
				title: 'FIXED: Fix auth feat',
				status: 'DONE',
			})
			.expect(204)

		const task = await prisma.task.findUnique({ where: { id: taskId } })

		expect(task?.title).toBe('FIXED: Fix auth feat')
		expect(task?.status).toBe('DONE')
		expect(task?.priority).toBe('HIGH')
	})

	afterAll(async () => {
		await app.close()
	})
})
