import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { type Either, left, right } from '@/core/types/either'
import { Token } from '../../enterprise/entities/token'
import type { EmailSender } from '../email/email-sender'
import type { TokensRepository } from '../repositories/tokens-repository'
import type { UsersRepository } from '../repositories/users-repository'

type RequestPasswordRecoverUseCaseRequest = {
	email: string
}

type RequestPasswordRecoverUseCaseResponse = Either<ResourceNotFoundError, null>

export class RequestPasswordRecoverUseCase {
	constructor(
		private usersRepository: UsersRepository,
		private tokensRepository: TokensRepository,
		private emailSender: EmailSender,
	) {}

	async execute({
		email,
	}: RequestPasswordRecoverUseCaseRequest): Promise<RequestPasswordRecoverUseCaseResponse> {
		const user = await this.usersRepository.findByEmail(email)

		if (!user) {
			return left(new ResourceNotFoundError())
		}

		const token = Token.create({
			userId: user.id,
			type: 'PASSWORD_RECOVER',
		})

		await this.tokensRepository.create(token)

		await this.emailSender.sendRecoveryCode(user.email, token.id.toString())

		return right(null)
	}
}
