import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { type Either, left, right } from '@/core/types/either'
import type { Hasher } from '../cryptography/hasher'
import type { TokensRepository } from '../repositories/tokens-repository'
import type { UsersRepository } from '../repositories/users-repository'
import { InvalidTokenError } from './errors/invalid-token-error'

interface ResetPasswordUseCaseRequest {
	recoverCode: string
	password: string
}

type ResetPasswordUseCaseResponse = Either<ResourceNotFoundError | InvalidTokenError, null>

export class ResetPasswordUseCase {
	constructor(
		private usersRepository: UsersRepository,
		private tokensRepository: TokensRepository,
		private hasher: Hasher,
	) {}

	async execute({
		recoverCode,
		password,
	}: ResetPasswordUseCaseRequest): Promise<ResetPasswordUseCaseResponse> {
		const token = await this.tokensRepository.findById(recoverCode)

		if (!token) {
			return left(new ResourceNotFoundError())
		}

		const user = await this.usersRepository.findById(token.userId.toString())

		if (!user) {
			return left(new ResourceNotFoundError())
		}

		if (token.isExpired()) {
			return left(new InvalidTokenError('Token is expired'))
		}

		if (token.isUsed()) {
			return left(new InvalidTokenError('Token is already used'))
		}

		user.passwordHash = await this.hasher.generate(password)

		await this.usersRepository.save(user)

		token.use()

		await this.tokensRepository.save(token)

		return right(null)
	}
}
