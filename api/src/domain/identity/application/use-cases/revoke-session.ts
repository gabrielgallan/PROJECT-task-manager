import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { Either, left, right } from '@/core/types/either'
import { SessionsRepository } from '../repositories/sessions-repository'

type RevokeSessionUseCaseRequest = {
	sessionId: string
}

type RevokeSessionUseCaseResponse = Either<ResourceNotFoundError, null>

export class RevokeSessionUseCase {
	constructor(private sessionsRepository: SessionsRepository) {}

	async execute({ sessionId }: RevokeSessionUseCaseRequest): Promise<RevokeSessionUseCaseResponse> {
		const session = await this.sessionsRepository.findById(sessionId)

		if (!session) {
			return left(new ResourceNotFoundError())
		}

		session.revoke()

		await this.sessionsRepository.save(session)

		return right(null)
	}
}
