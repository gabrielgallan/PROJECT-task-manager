import { Injectable } from '@nestjs/common'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { type Either, left, right } from '@/core/types/either'
import { SessionTokenHasher } from '../cryptography/session-token-hasher'
import { SessionsRepository } from '../repositories/sessions-repository'
import { InvalidSessionError } from './errors/invalid-session-error'

type ValidateSessionTokenCaseRequest = {
	token: string
}

type ValidateSessionTokenUseCaseResponse = Either<
	ResourceNotFoundError | InvalidSessionError,
	{ userId: string; sessionId: string }
>

@Injectable()
export class ValidateSessionTokenUseCase {
	constructor(
		private sessionsRepository: SessionsRepository,
		private sessionTokenHasher: SessionTokenHasher,
	) {}

	async execute({
		token,
	}: ValidateSessionTokenCaseRequest): Promise<ValidateSessionTokenUseCaseResponse> {
		const tokenHash = this.sessionTokenHasher.hash(token)

		const session = await this.sessionsRepository.findByTokenHash(tokenHash)

		if (!session) {
			return left(new ResourceNotFoundError())
		}

		if (session.isExpired() || session.isRevoked()) {
			return left(new InvalidSessionError())
		}

		return right({
			userId: session.userId.toString(),
			sessionId: session.id.toString(),
		})
	}
}
