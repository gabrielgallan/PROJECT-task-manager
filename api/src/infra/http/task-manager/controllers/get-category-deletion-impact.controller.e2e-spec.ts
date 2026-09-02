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

describe('Get category deletion impact [E2E]', () => {
	let app: INestApplication
	let prisma: PrismaService
	let sessionTokenGenerator: SessionTokenGenerator
	let sessionTokenHasher: SessionTokenHasher

	let userId: string
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
				categories: {
					create: {
						id: categoryId,
						name: 'Work Meeting',
						color: 'blue',
						plans: {
							createMany: {
								data: [
									{
										userId,
										title: 'Integrator Meeting',
										startsAt: new Date(),
										endsAt: new Date(),
									},
								],
							},
						},
						workLogs: {
							createMany: {
								data: [
									{
										userId,
										title: 'Guide Review',
										startsAt: new Date(),
										endsAt: new Date(),
									},
									{
										userId,
										title: 'Auth feat',
										startsAt: new Date(),
										endsAt: new Date(),
									},
								],
							},
						},
					},
				},
			},
		})
	})

	it('[GET] /api/categories/:categoryId/deletion-impact', async () => {
		const response = await request(app.getHttpServer())
			.get(`/api/categories/${categoryId}/deletion-impact`)
			.set('Cookie', `${SESSION_COOKIE_NAME}=${sessionToken}`)
			.expect(200)

		expect(response.body.data).toMatchObject({
			plansCount: 1,
			workLogsCount: 2,
		})
	})

	afterAll(async () => {
		await app.close()
	})
})
