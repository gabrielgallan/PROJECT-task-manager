import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { Hasher } from '@/domain/identity/application/cryptography/hasher'
import { AppModule } from '@/infra/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'

describe('Reset password [E2E]', () => {
	let app: INestApplication
	let prisma: PrismaService
	let hasher: Hasher

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		}).compile()

		app = moduleRef.createNestApplication()

		prisma = moduleRef.get(PrismaService)

		hasher = moduleRef.get(Hasher)

		await app.init()
	})

	it('[PATCH] /api/profile/password-recover', async () => {
		const user = await prisma.user.create({
			data: {
				email: 'johndoe@email.com',
				passwordHash: 'johnDoe123',
				tokens: {
					create: {
						id: 'valid-token',
						type: 'PASSWORD_RECOVER',
						expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 1),
					},
				},
			},
		})

		await request(app.getHttpServer())
			.patch('/api/profile/password-recover')
			.send({
				tokenId: 'valid-token',
				password: 'newPassword123',
			})
			.expect(204)

		const updatedUser = await prisma.user.findUnique({
			where: { id: user.id },
		})

		expect(updatedUser?.passwordHash).not.toBe('johnDoe123')
		expect(await hasher.compare('newPassword123', updatedUser?.passwordHash)).toBe(true)
	})

	afterAll(async () => {
		await app.close()
	})
})
