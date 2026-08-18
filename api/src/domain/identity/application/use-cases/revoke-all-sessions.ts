import { Injectable } from '@nestjs/common'
import { Either, right } from '@/core/types/either'
import { SessionsRepository } from '../repositories/sessions-repository'

type RevokeAllSessionsUseCaseRequest = {
	userId: string
}

type RevokeAllSessionsUseCaseResponse = Either<null, { sessionsCount: number }>

@Injectable()
export class RevokeAllSessionsUseCase {
	constructor(private sessionsRepository: SessionsRepository) {}

	async execute({
		userId,
	}: RevokeAllSessionsUseCaseRequest): Promise<RevokeAllSessionsUseCaseResponse> {
		const sessionsCount = await this.sessionsRepository.revokeAllByUserId(userId, new Date())

		return right({ sessionsCount })
	}
}
