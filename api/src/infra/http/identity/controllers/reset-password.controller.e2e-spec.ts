import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { UUIDGenerator } from 'test/e2e/factories/uuid-generator'
import { Hasher } from '@/domain/identity/application/cryptography/hasher'
import { AppModule } from '@/infra/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'

describe('Reset password [E2E]', () => {
	let app: INestApplication
	let prisma: PrismaService
	let _hasher: Hasher

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		}).compile()

		app = moduleRef.createNestApplication()

		prisma = moduleRef.get(PrismaService)

		_hasher = moduleRef.get(Hasher)

		await app.init()
	})

	it('[PATCH] /api/profile/password-recover', async () => {
		const [tokenId] = UUIDGenerator(1)

		const user = await prisma.user.create({
			data: {
				email: 'johndoe@email.com',
				passwordHash: 'johnDoe123',
				tokens: {
					create: {
						id: tokenId,
						type: 'PASSWORD_RECOVER',
						expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 1),
						usedAt: null,
					},
				},
			},
		})

		await request(app.getHttpServer())
			.patch('/api/profile/password-recover')
			.send({
				tokenId: tokenId,
				password: 'newPassword123',
			})
			.expect(204)

		const updatedUser = await prisma.user.findUnique({
			where: { id: user.id },
		})

		expect(updatedUser?.passwordHash).not.toBe('johnDoe123')
	})

	afterAll(async () => {
		await app.close()
	})
})
