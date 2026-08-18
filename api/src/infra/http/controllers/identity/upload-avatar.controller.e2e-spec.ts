import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { addDays } from 'date-fns'
import request from 'supertest'
import { UploaderStub } from 'test/stubs/uploader'
import { SessionTokenGenerator } from '@/domain/identity/application/cryptography/session-token-generator'
import { SessionTokenHasher } from '@/domain/identity/application/cryptography/session-token-hasher'
import { Uploader } from '@/domain/identity/application/storage/uploader'
import { AppModule } from '@/infra/app.module'
import { SESSION_COOKIE_NAME } from '@/infra/auth/session-cookie'
import { PrismaService } from '@/infra/database/prisma/prisma.service'

describe('Upload avatar [E2E]', () => {
	let app: INestApplication
	let prisma: PrismaService
	let sessionTokenGenerator: SessionTokenGenerator
	let sessionTokenHasher: SessionTokenHasher

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		})
			.overrideProvider(Uploader)
			.useClass(UploaderStub)
			.compile()

		app = moduleRef.createNestApplication()

		prisma = moduleRef.get(PrismaService)

		sessionTokenGenerator = moduleRef.get(SessionTokenGenerator)

		sessionTokenHasher = moduleRef.get(SessionTokenHasher)

		await app.init()
	})

	it('[PUT] /api/profile/avatar', async () => {
		const sessionToken = sessionTokenGenerator.generate()

		await prisma.user.create({
			data: {
				email: 'johndoe@email.com',
				sessions: {
					createMany: {
						data: [
							{
								tokenHash: sessionTokenHasher.hash(sessionToken),
								expiresAt: addDays(new Date(), 30),
							},
						],
					},
				},
			},
		})

		await request(app.getHttpServer())
			.put('/api/profile/avatar')
			.set('Cookie', `${SESSION_COOKIE_NAME}=${sessionToken}`)
			.expect(204)

		const user = await prisma.user.findUnique({
			where: {
				email: 'johndoe@email.com',
			},
		})

		expect(user?.avatarUrl).toEqual(expect.any(String))
	})

	afterAll(async () => {
		await app.close()
	})
})
