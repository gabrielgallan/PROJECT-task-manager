import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { EmailSenderStub } from 'test/stubs/email-sender'
import { EmailSender } from '@/domain/identity/application/email/email-sender'
import { AppModule } from '@/infra/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'

describe('Request password recover [E2E]', () => {
	let app: INestApplication
	let prisma: PrismaService

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		})
			.overrideProvider(EmailSender)
			.useClass(EmailSenderStub)
			.compile()

		app = moduleRef.createNestApplication()

		prisma = moduleRef.get(PrismaService)

		await app.init()
	})

	it('[POST] /api/profile/password-recover', async () => {
		const user = await prisma.user.create({
			data: {
				email: 'johndoe@email.com',
			},
		})

		await request(app.getHttpServer())
			.post('/api/profile/password-recover')
			.send({
				email: 'johndoe@email.com',
			})
			.expect(201)

		const recoverToken = await prisma.token.findFirst({
			where: { type: 'PASSWORD_RECOVER', userId: user.id },
		})

		expect(recoverToken).toBeTruthy()
	})

	afterAll(async () => {
		await app.close()
	})
})
