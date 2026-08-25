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

describe('Fetch task options [E2E]', () => {
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
								title: 'Add auth feat',
							},
							{
								title: 'Add session feat',
							},
							{
								title: 'Add checkout feat',
							},
							{
								title: 'Add products feat',
							},
							{
								title: 'Add payments feat',
							},
							{
								title: 'Add users feat',
							},
							{
								title: 'Remove notifications feat',
							},
							{
								title: 'Remove .env',
							},
						],
					},
				},
			},
		})
	})

	it('[GET] /api/tasks/options', async () => {
		const response1 = await request(app.getHttpServer())
			.get('/api/tasks/options')
			.set('Cookie', `${SESSION_COOKIE_NAME}=${sessionToken}`)
			.query({
				q: 'feat',
				limit: 5,
			})
			.expect(200)

		expect(response1.body.data).toHaveLength(5)

		const response2 = await request(app.getHttpServer())
			.get('/api/tasks/options')
			.set('Cookie', `${SESSION_COOKIE_NAME}=${sessionToken}`)
			.query({
				q: 'feat',
				limit: 5,
				cursor: response1.body.meta.nextCursor,
			})
			.expect(200)

		expect(response2.body.data).toHaveLength(2)
	})

	afterAll(async () => {
		await app.close()
	})
})
