import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { addDays } from 'date-fns'
import request from 'supertest'
import { SessionTokenGenerator } from '@/domain/identity/application/cryptography/session-token-generator'
import { SessionTokenHasher } from '@/domain/identity/application/cryptography/session-token-hasher'
import { AppModule } from '@/infra/app.module'
import { SESSION_COOKIE_NAME } from '@/infra/auth/session-cookie'
import { PrismaService } from '@/infra/database/prisma/prisma.service'

describe('Edit profile [E2E]', () => {
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

	it('[PUT] /api/profile', async () => {
		const sessionToken = sessionTokenGenerator.generate()

		await prisma.user.create({
			data: {
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

		await request(app.getHttpServer())
			.put('/api/profile')
			.set('Cookie', `${SESSION_COOKIE_NAME}=${sessionToken}`)
			.send({
				name: 'John',
				jobTitle: 'Tech Enginner',
			})
			.expect(204)

		const user = await prisma.user.findUnique({ where: { email: 'johndoe@email.com' } })

		expect(user?.name).toBe('John')
		expect(user?.jobTitle).toBe('Tech Enginner')
	})

	afterAll(async () => {
		await app.close()
	})
})
