import { Injectable } from '@nestjs/common'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { Either, left, right } from '@/core/types/either'
import { SessionsRepository } from '../repositories/sessions-repository'

type RevokeSessionUseCaseRequest = {
	userId: string
	sessionId: string
}

type RevokeSessionUseCaseResponse = Either<ResourceNotFoundError | NotAllowedError, null>

@Injectable()
export class RevokeSessionUseCase {
	constructor(private sessionsRepository: SessionsRepository) {}

	async execute({
		userId,
		sessionId,
	}: RevokeSessionUseCaseRequest): Promise<RevokeSessionUseCaseResponse> {
		const session = await this.sessionsRepository.findById(sessionId)

		if (!session) {
			return left(new ResourceNotFoundError())
		}

		if (session.userId.toString() !== userId) {
			return left(new NotAllowedError())
		}

		session.revoke()

		await this.sessionsRepository.save(session)

		return right(null)
	}
}
