import { Either, right } from '@/core/types/either'
import { SessionsRepository } from '../repositories/sessions-repository'

type RevokeAllSessionsUseCaseRequest = {
	userId: string
}

type RevokeAllSessionsUseCaseResponse = Either<null, { count: number }>

export class RevokeAllSessionsUseCase {
	constructor(private sessionsRepository: SessionsRepository) {}

	async execute({
		userId,
	}: RevokeAllSessionsUseCaseRequest): Promise<RevokeAllSessionsUseCaseResponse> {
		const count = await this.sessionsRepository.revokeAllByUserId(userId, new Date())

		return right({ count })
	}
}
