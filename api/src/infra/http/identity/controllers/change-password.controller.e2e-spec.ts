import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { addDays } from 'date-fns'
import request from 'supertest'
import { Hasher } from '@/domain/identity/application/cryptography/hasher'
import { SessionTokenGenerator } from '@/domain/identity/application/cryptography/session-token-generator'
import { SessionTokenHasher } from '@/domain/identity/application/cryptography/session-token-hasher'
import { AppModule } from '@/infra/app.module'
import { SESSION_COOKIE_NAME } from '@/infra/auth/session-cookie'
import { PrismaService } from '@/infra/database/prisma/prisma.service'

describe('Change password [E2E]', () => {
	let app: INestApplication
	let prisma: PrismaService
	let hasher: Hasher
	let sessionTokenGenerator: SessionTokenGenerator
	let sessionTokenHasher: SessionTokenHasher

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		}).compile()

		app = moduleRef.createNestApplication()

		prisma = moduleRef.get(PrismaService)

		hasher = moduleRef.get(Hasher)

		sessionTokenGenerator = moduleRef.get(SessionTokenGenerator)

		sessionTokenHasher = moduleRef.get(SessionTokenHasher)

		await app.init()
	})

	it('[PATCH] /api/profile/password', async () => {
		const sessionToken = sessionTokenGenerator.generate()

		await prisma.user.create({
			data: {
				email: 'johndoe@email.com',
				passwordHash: await hasher.generate('johnDoe123'),
				sessions: {
					create: {
						tokenHash: sessionTokenHasher.hash(sessionToken),
						expiresAt: addDays(new Date(), 30),
					},
				},
			},
		})

		await request(app.getHttpServer())
			.patch('/api/profile/password')
			.set('Cookie', `${SESSION_COOKIE_NAME}=${sessionToken}`)
			.send({
				currentPassword: 'johnDoe123',
				newPassword: 'johnNewPassword',
			})
			.expect(204)

		const user = await prisma.user.findUnique({
			where: { email: 'johndoe@email.com' },
		})

		if (!user?.passwordHash) {
			throw new Error('(Change Password [E2E]) - User without passwordHash!')
		}

		const isPasswordCorrect = await hasher.compare('johnNewPassword', user.passwordHash)

		expect(isPasswordCorrect).toBe(true)
	})

	afterAll(async () => {
		await app.close()
	})
})
